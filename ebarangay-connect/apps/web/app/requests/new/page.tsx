"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DocumentType = {
  id: number;
  name: string;
  description: string | null;
  processing_days: number;
  fee: number;
};

export default function NewRequestPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [purpose, setPurpose] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setErrorMessage("");

    // Check current login session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setErrorMessage(`AUTH ERROR: ${sessionError.message}`);
      setLoading(false);
      return;
    }

    // Redirect logged-out users to Login
    if (!session) {
      router.replace("/login");
      return;
    }

    console.log("LOGGED-IN USER:", session.user.id);
    console.log("AUTH ROLE:", session.user.role);

    // Load active document types
    const { data, error } = await supabase
      .from("document_types")
      .select("id, name, description, processing_days, fee")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (error) {
      setErrorMessage(`DOCUMENT ERROR: ${error.message}`);
      setLoading(false);
      return;
    }

    setDocuments(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!selectedDocument) {
      setErrorMessage("Please select a document.");
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage("Please enter the purpose of your request.");
      return;
    }

    setSubmitting(true);

    // Get the CURRENT authenticated session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // Redirect if the session expired
    if (sessionError || !session) {
      setErrorMessage(
        `AUTH ERROR: ${sessionError?.message || "Your session has expired."}`
      );
      setSubmitting(false);

      setTimeout(() => {
        router.replace("/login");
      }, 1000);

      return;
    }

    const userId = session.user.id;

    console.log("SUBMIT USER ID:", userId);
    console.log("SUBMIT AUTH ROLE:", session.user.role);

    // Insert request
    const { data: request, error: requestError } = await supabase
      .from("document_requests")
      .insert({
        profile_id: userId,
        document_type_id: Number(selectedDocument),
        purpose: purpose.trim(),
        status: "Pending",
      })
      .select()
      .single();

    if (requestError) {
      console.error("REQUEST ERROR:", requestError);

      setErrorMessage(
        `REQUEST ERROR: ${requestError.message} | Code: ${
          requestError.code || "N/A"
        }`
      );

      setSubmitting(false);
      return;
    }

    // Insert initial status history
    const { error: historyError } = await supabase
      .from("request_status_history")
      .insert({
        request_id: request.id,
        status: "Pending",
        remarks: "Request submitted successfully.",
      });

    if (historyError) {
      console.error("HISTORY ERROR:", historyError);

      setErrorMessage(
        `HISTORY ERROR: ${historyError.message} | Code: ${
          historyError.code || "N/A"
        }`
      );

      setSubmitting(false);
      return;
    }

    setMessage("Request submitted successfully!");

    setTimeout(() => {
      router.push("/requests");
    }, 1000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">
          Checking your account...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() => router.back()}
          className="mb-6 text-gray-400 hover:text-white"
        >
          ← Back
        </button>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

          <h1 className="mb-2 text-2xl font-bold">
            Request a Document
          </h1>

          <p className="mb-8 text-gray-400">
            Select a document and provide the purpose of your request.
          </p>

          {errorMessage && (
            <div className="mb-5 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-lg border border-green-800 bg-green-950/40 p-4 text-green-300">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="mb-2 block text-sm font-medium">
                Document Type
              </label>

              <select
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white"
              >
                <option value="">
                  Select a document
                </option>

                {documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDocument && (
              <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">

                {(() => {
                  const document = documents.find(
                    (item) => item.id === Number(selectedDocument)
                  );

                  if (!document) return null;

                  return (
                    <>
                      <p className="text-gray-300">
                        {document.description ||
                          "No description available."}
                      </p>

                      <div className="mt-3 flex gap-6 text-sm text-gray-400">
                        <span>
                          Processing: {document.processing_days} day
                          {document.processing_days !== 1 ? "s" : ""}
                        </span>

                        <span>
                          Fee: ₱
                          {Number(document.fee).toFixed(2)}
                        </span>
                      </div>
                    </>
                  );
                })()}

              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Purpose
              </label>

              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter the purpose of your request..."
                rows={5}
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-700"
            >
              {submitting
                ? "Submitting..."
                : "Submit Request"}
            </button>

          </form>

        </div>
      </div>
    </main>
  );
}