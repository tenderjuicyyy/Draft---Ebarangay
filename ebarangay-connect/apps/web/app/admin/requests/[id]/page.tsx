"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestDetails = {
  id: number;
  profile_id: string;
  status: string | null;
  purpose: string | null;
  document_type_id: number;
  document_types:
    | {
        name: string;
        processing_days: number;
        fee: number;
      }
    | {
        name: string;
        processing_days: number;
        fee: number;
      }[]
    | null;
};

type StatusHistory = {
  id: number;
  status: string;
  remarks: string | null;
};

export default function AdminRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const requestId = Number(params.id);

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRequest() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (profileError) {
        console.error("Profile check error:", profileError);

        setErrorMessage(
          "Unable to verify your admin access."
        );
        setLoading(false);
        return;
      }

      if (!profile) {
        setErrorMessage(
          "Your profile was not found. Please make sure your profile exists in the profiles table."
        );
        setLoading(false);
        return;
      }

      if (profile.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      if (!requestId || Number.isNaN(requestId)) {
        setErrorMessage("Invalid request ID.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("document_requests")
        .select(`
          id,
          profile_id,
          status,
          purpose,
          document_type_id,
          document_types (
            name,
            processing_days,
            fee
          )
        `)
        .eq("id", requestId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Request loading error:", error);

        setErrorMessage(
          "Failed to load request details."
        );
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage("Request not found.");
        setLoading(false);
        return;
      }

      setRequest(data as RequestDetails);

      const {
        data: historyData,
        error: historyError,
      } = await supabase
        .from("request_status_history")
        .select("id, status, remarks")
        .eq("request_id", requestId)
        .order("id", { ascending: true });

      if (historyError) {
        console.error(
          "History loading error:",
          historyError
        );
      }

      if (cancelled) {
        return;
      }

      setHistory(historyData ?? []);
      setLoading(false);
    }

    loadRequest();

    return () => {
      cancelled = true;
    };
  }, [requestId, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const getDocumentType = () => {
    if (!request?.document_types) {
      return null;
    }

    if (Array.isArray(request.document_types)) {
      return request.document_types[0] ?? null;
    }

    return request.document_types;
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "completed") {
      return <Check size={18} />;
    }

    if (normalizedStatus === "rejected") {
      return <X size={18} />;
    }

    if (normalizedStatus === "processing") {
      return <Loader2 size={18} />;
    }

    return <Clock size={18} />;
  };

  const getStatusClass = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "completed") {
      return "bg-emerald-100 text-emerald-700";
    }

    if (normalizedStatus === "rejected") {
      return "bg-red-100 text-red-700";
    }

    if (normalizedStatus === "processing") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-amber-100 text-amber-700";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2
            size={22}
            className="animate-spin"
          />
          Checking admin access...
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <X size={24} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Unable to Load Request
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {errorMessage}
          </p>

          <Link
            href="/admin"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft size={17} />
            Back to Admin Dashboard
          </Link>

        </div>
      </main>
    );
  }

  const documentType = getDocumentType();

  return (
    <main className="min-h-screen bg-slate-50">

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              eBarangay Connect
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Admin Request Details
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Back to Admin Dashboard
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-sm text-slate-500">
                  Request #{request?.id}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {documentType?.name ?? "Unknown Document"}
                </h2>
              </div>

              {request?.status && (
                <span
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusClass(
                    request.status
                  )}`}
                >
                  {request.status}
                </span>
              )}

            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Request ID
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  #{request?.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Document Type ID
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {request?.document_type_id}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Processing Time
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {documentType?.processing_days ?? 0} day
                  {documentType?.processing_days === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Fee
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  ₱{documentType?.fee ?? 0}
                </p>
              </div>

            </div>

            <div className="mt-8">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Purpose
              </p>

              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {request?.purpose || "No purpose provided."}
              </div>

            </div>

          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-lg font-bold text-slate-900">
              Status History
            </h2>

            {history.length === 0 ? (
              <p className="mt-5 text-sm text-slate-500">
                No status history available.
              </p>
            ) : (
              <div className="mt-6 space-y-5">

                {history.map((item, index) => (

                  <div
                    key={item.id}
                    className="relative"
                  >

                    {index < history.length - 1 && (
                      <div className="absolute -bottom-5 left-4 top-9 w-px bg-slate-200" />
                    )}

                    <div className="flex gap-3">

                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {getStatusIcon(item.status)}
                      </div>

                      <div className="flex-1">

                        <div className="flex items-center justify-between gap-2">

                          <p className="font-semibold text-slate-800">
                            {item.status}
                          </p>

                          <span className="text-xs text-slate-400">
                            #{item.id}
                          </span>

                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.remarks ||
                            "No remarks provided."}
                        </p>

                      </div>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </section>

        </div>

      </div>

    </main>
  );
}