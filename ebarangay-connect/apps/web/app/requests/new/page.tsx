"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Home,
  Loader2,
  PhilippinePeso,
  ShieldCheck,
} from "lucide-react";
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
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (sessionError) {
        setErrorMessage(`AUTH ERROR: ${sessionError.message}`);
        setLoading(false);
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      console.log("LOGGED-IN USER:", session.user.id);
      console.log("AUTH ROLE:", session.user.role);

      const { data, error } = await supabase
        .from("document_types")
        .select("id, name, description, processing_days, fee")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(`DOCUMENT ERROR: ${error.message}`);
        setLoading(false);
        return;
      }

      setDocuments(data || []);
      setLoading(false);
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [router]);

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

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

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
    setSubmitting(false);

    setTimeout(() => {
      router.push("/requests");
    }, 1000);
  }

  const selectedDocumentDetails = documents.find(
    (document) => document.id === Number(selectedDocument)
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f0e4] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4d5435] text-[#f7f2e7]">
            <Loader2 size={27} className="animate-spin" />
          </div>

          <p className="mt-5 text-lg font-black text-[#25281e]">
            Preparing your request
          </p>

          <p className="mt-1 text-sm text-[#777465]">
            Checking your account and available services.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#77794f] px-3 py-3 text-[#25281e] sm:px-5 sm:py-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-4xl bg-[#f4f0e4] shadow-2xl sm:min-h-[calc(100vh-40px)]">
        {/* HEADER */}
        <header className="border-b border-[#dcd5c4] bg-[#f7f3e9]">
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#7b8058] text-[#59603d]">
                <Home size={20} />
              </div>

              <div>
                <p className="text-lg font-black leading-none tracking-tight text-[#24271d]">
                  eBarangay
                </p>

                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7b8058]">
                  Connect
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-full border border-[#d3ccba] px-5 py-2.5 text-sm font-bold text-[#555548] transition hover:bg-[#ebe5d7] sm:inline-flex"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">
          {/* BACK */}
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#696958] transition hover:text-[#b55f3b]"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {/* INTRO */}
          <section className="mb-7">
            <div className="flex w-fit items-center gap-2 rounded-full border border-[#d2cab6] bg-[#eee8da] px-4 py-2">
              <FileText size={14} className="text-[#6c744d]" />

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#65664e]">
                Document Services
              </span>
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] text-[#25271e] sm:text-5xl">
              Request a barangay document
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#706f62] sm:text-base">
              Select the document you need and provide the purpose of your
              request. You can monitor its status from My Requests after
              submission.
            </p>
          </section>

          {/* MESSAGES */}
          {errorMessage && (
            <div className="mb-6 rounded-3xl border border-[#dfb9aa] bg-[#f7e5de] p-5">
              <p className="font-black text-[#8d4938]">
                Unable to continue
              </p>

              <p className="mt-1 wrap-break-word text-sm leading-6 text-[#9b5a49]">
                {errorMessage}
              </p>
            </div>
          )}

          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-3xl border border-[#bdc9ae] bg-[#e5ecdc] p-5">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-[#53663e]"
              />

              <div>
                <p className="font-black text-[#435332]">
                  Request submitted
                </p>

                <p className="mt-1 text-sm text-[#5f704d]">
                  {message} Redirecting you to My Requests...
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            {/* FORM */}
            <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
              <div className="border-b border-[#ded7c6] pb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                  New Request
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#292c21]">
                  Request information
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#777465]">
                  Complete the information below before submitting your
                  document request.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7">
                {/* DOCUMENT */}
                <div>
                  <label
                    htmlFor="document"
                    className="text-sm font-black text-[#34372b]"
                  >
                    Select document
                  </label>

                  <p className="mt-1 text-xs text-[#858273]">
                    Choose the barangay document you want to request.
                  </p>

                  <select
                    id="document"
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    disabled={submitting}
                    className="mt-3 w-full rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm font-semibold text-[#34372b] outline-none transition focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Choose a document</option>

                    {documents.map((document) => (
                      <option
                        key={document.id}
                        value={document.id}
                      >
                        {document.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SELECTED DOCUMENT DETAILS */}
                {selectedDocumentDetails && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#ece6d8] p-4">
                      <div className="flex items-center gap-2 text-[#656b49]">
                        <Clock3 size={17} />

                        <span className="text-xs font-bold uppercase tracking-wide">
                          Processing
                        </span>
                      </div>

                      <p className="mt-2 font-black text-[#303328]">
                        {selectedDocumentDetails.processing_days}{" "}
                        {selectedDocumentDetails.processing_days === 1
                          ? "day"
                          : "days"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#ece6d8] p-4">
                      <div className="flex items-center gap-2 text-[#656b49]">
                        <PhilippinePeso size={17} />

                        <span className="text-xs font-bold uppercase tracking-wide">
                          Fee
                        </span>
                      </div>

                      <p className="mt-2 font-black text-[#303328]">
                        {selectedDocumentDetails.fee === 0
                          ? "Free"
                          : `₱${selectedDocumentDetails.fee}`}
                      </p>
                    </div>

                    {selectedDocumentDetails.description && (
                      <div className="rounded-2xl bg-[#ece6d8] p-4 sm:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#777465]">
                          About this document
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#656458]">
                          {selectedDocumentDetails.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* PURPOSE */}
                <div className="mt-7">
                  <label
                    htmlFor="purpose"
                    className="text-sm font-black text-[#34372b]"
                  >
                    Purpose of request
                  </label>

                  <p className="mt-1 text-xs text-[#858273]">
                    Briefly explain why you need this document.
                  </p>

                  <textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    disabled={submitting}
                    rows={6}
                    placeholder="Example: Employment requirement, school requirement, scholarship application..."
                    className="mt-3 w-full resize-none rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm leading-6 text-[#34372b] outline-none transition placeholder:text-[#aaa697] focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* SUBMIT */}
                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#ded7c6] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d1c9b7] px-5 py-3 text-sm font-bold text-[#646455] transition hover:bg-[#eee8da] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft size={16} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c96f46] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#b8613d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* SIDE PANEL */}
            <aside className="space-y-5">
              <div className="overflow-hidden rounded-4xl bg-[#4d5435] p-6 text-[#f7f2e7] sm:p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2ecdf] text-[#505738]">
                  <FileCheck2 size={21} />
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#d1d3ba]">
                  Simple Process
                </p>

                <h2 className="mt-2 text-2xl font-black leading-tight">
                  What happens next?
                </h2>

                <div className="mt-6 space-y-5">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#c96f46] text-xs font-black text-white">
                      1
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        Submit your request
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#d4d5c5]">
                        Choose a document and provide your purpose.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#69704a] text-xs font-black text-white">
                      2
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        Barangay processing
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#d4d5c5]">
                        Your request will be reviewed and processed by the
                        barangay.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#69704a] text-xs font-black text-white">
                      3
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        Track your status
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#d4d5c5]">
                        Check My Requests for Pending, Processing, Completed,
                        or Rejected updates.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/requests"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[#f0c4a9] transition hover:text-white"
                >
                  View My Requests
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="rounded-3xl border border-[#dcd5c4] bg-[#f8f4ea] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6e8d8] text-[#5b6442]">
                    <ShieldCheck size={19} />
                  </div>

                  <div>
                    <p className="font-black text-[#303328]">
                      Resident account
                    </p>

                    <p className="text-xs text-[#858273]">
                      Secure request submission
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#706f62]">
                  Your request is connected to your authenticated resident
                  account so you can monitor its progress after submission.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="border-t border-[#d9d2c1] bg-[#f7f3e9] px-5 py-5 sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-[#858273] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 eBarangay Connect</p>
            <p>Digital barangay services for residents.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}