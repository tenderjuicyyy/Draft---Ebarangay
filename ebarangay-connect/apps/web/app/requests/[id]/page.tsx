"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  id: number;
  profile_id: string;
  document_type_id: number;
  purpose: string | null;
  status: string | null;
  document_types:
    | {
        name: string;
        processing_days: number | null;
        fee: number | null;
      }
    | {
        name: string;
        processing_days: number | null;
        fee: number | null;
      }[]
    | null;
};

type HistoryItem = {
  id: number;
  request_id: number;
  status: string;
  remarks: string | null;
};

export default function RequestDetailsPage() {
  const params = useParams();
  const id = Number(params.id);

  const [request, setRequest] = useState<RequestItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    async function loadRequest() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("document_requests")
        .select(`
          id,
          profile_id,
          document_type_id,
          purpose,
          status,
          document_types (
            name,
            processing_days,
            fee
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setRequest(data);

      const { data: historyData, error: historyError } =
        await supabase
          .from("request_status_history")
          .select(`
            id,
            request_id,
            status,
            remarks
          `)
          .eq("request_id", id)
          .order("id", { ascending: true });

      if (historyError) {
        setErrorMessage(historyError.message);
        setLoading(false);
        return;
      }

      setHistory(historyData || []);
      setLoading(false);
    }

    loadRequest();
  }, [id]);

  function getDocumentType() {
    if (!request?.document_types) {
      return null;
    }

    if (Array.isArray(request.document_types)) {
      return request.document_types[0] || null;
    }

    return request.document_types;
  }

  function getStatusStyle(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "pending":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  function getHistoryIcon(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return <Check size={17} />;

      case "processing":
        return <Loader2 size={17} />;

      case "rejected":
        return <X size={17} />;

      case "pending":
      default:
        return <Clock size={17} />;
    }
  }

  function getHistoryIconStyle(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "pending":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  const documentType = getDocumentType();

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="border-b bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

          <Link
            href="/admin"
            className="flex items-center gap-2 font-bold text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Admin
          </Link>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            Admin
          </span>

        </div>

      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-5xl px-6 py-10">

        {/* TITLE */}
        <div>

          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Request #{id}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Request Details
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            View the complete information and status history for this request.
          </p>

        </div>

        {/* ERROR */}
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="font-semibold text-red-700">
              Error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>

          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">

            <p className="text-slate-500">
              Loading request details...
            </p>

          </div>
        ) : !request ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">

            <p className="font-semibold text-slate-700">
              Request not found.
            </p>

            <Link
              href="/admin"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Return to Admin
            </Link>

          </div>
        ) : (
          <div className="mt-8 space-y-6">

            {/* REQUEST INFORMATION */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col justify-between gap-4 sm:flex-row">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Document
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {documentType?.name || "Unknown Document"}
                  </h2>

                </div>

                <div>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(
                      request.status
                    )}`}
                  >
                    {request.status || "Pending"}
                  </span>

                </div>

              </div>

              {/* DETAILS */}
              <div className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Request ID
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    #{request.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Document Type ID
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {request.document_type_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Processing Time
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {documentType?.processing_days
                      ? `${documentType.processing_days} day${
                          documentType.processing_days > 1
                            ? "s"
                            : ""
                        }`
                      : "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Fee
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {documentType?.fee !== null &&
                    documentType?.fee !== undefined
                      ? `₱${documentType.fee}`
                      : "Not specified"}
                  </p>
                </div>

              </div>

              {/* PURPOSE */}
              <div className="mt-6 border-t border-slate-100 pt-6">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Purpose
                </p>

                <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {request.purpose || "No purpose provided."}
                </p>

              </div>

            </div>

            {/* STATUS HISTORY */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-slate-900">
                Status History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record of status changes for this request.
              </p>

              {history.length === 0 ? (
                <div className="mt-6 rounded-xl bg-slate-50 p-5">

                  <p className="text-sm text-slate-500">
                    No status history available.
                  </p>

                </div>
              ) : (
                <div className="mt-6 space-y-5">

                  {history.map((item, index) => (

                    <div
                      key={item.id}
                      className="flex gap-4"
                    >

                      {/* ICON */}
                      <div className="flex flex-col items-center">

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${getHistoryIconStyle(
                            item.status
                          )}`}
                        >
                          {getHistoryIcon(item.status)}
                        </div>

                        {index < history.length - 1 && (
                          <div className="mt-2 h-full min-h-8 w-px bg-slate-200" />
                        )}

                      </div>

                      {/* DETAILS */}
                      <div className="pb-4">

                        <div className="flex flex-wrap items-center gap-2">

                          <p className="font-semibold text-slate-900">
                            {item.status}
                          </p>

                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                            History #{item.id}
                          </span>

                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {item.remarks || "No remarks provided."}
                        </p>

                      </div>

                    </div>

                  ))}

                </div>
              )}

            </div>

          </div>
        )}

      </section>

    </main>
  );
}