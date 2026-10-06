"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  id: number;
  profile_id: string;
  status: string | null;
  purpose: string | null;
  document_types:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type HistoryItem = {
  id: number;
  request_id: number;
  status: string;
  remarks: string | null;
};

export default function RequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadRequests() {
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

    const userId = session.user.id;

    console.log("MY REQUESTS USER:", userId);

    // Load ONLY this user's requests
    const { data, error } = await supabase
      .from("document_requests")
      .select(`
        id,
        profile_id,
        status,
        purpose,
        document_types (
          name
        )
      `)
      .eq("profile_id", userId)
      .order("id", { ascending: false });

    if (error) {
      setErrorMessage(`REQUEST ERROR: ${error.message}`);
      setLoading(false);
      return;
    }

    setRequests(data || []);
    setLoading(false);
  }

  async function loadHistory() {
    setHistoryLoading(true);

    // Check login session before loading history
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("request_status_history")
      .select(`
        id,
        request_id,
        status,
        remarks
      `)
      .order("id", { ascending: true });

    if (error) {
      setErrorMessage(`HISTORY ERROR: ${error.message}`);
      setHistoryLoading(false);
      return;
    }

    setHistory(data || []);
    setHistoryLoading(false);
  }

  useEffect(() => {
    loadRequests();
    loadHistory();
  }, []);

  function getDocumentName(request: RequestItem) {
    if (Array.isArray(request.document_types)) {
      return request.document_types[0]?.name || "Unknown Document";
    }

    return request.document_types?.name || "Unknown Document";
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
        return <Check size={16} />;

      case "processing":
        return <Loader2 size={16} />;

      case "rejected":
        return <X size={16} />;

      case "pending":
      default:
        return <Clock size={16} />;
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

  function getRequestHistory(requestId: number) {
    return history.filter(
      (item) => item.request_id === requestId
    );
  }

  function renderStatusTracker(status: string | null) {
    const currentStatus = status?.toLowerCase();

    if (currentStatus === "rejected") {
      return (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700">
              <X size={18} />
            </div>

            <div>
              <p className="font-semibold text-red-700">
                Request Rejected
              </p>

              <p className="text-sm text-red-600">
                This request has been rejected by the barangay.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const steps = [
      {
        name: "Pending",
        value: "pending",
        icon: <Clock size={16} />,
      },
      {
        name: "Processing",
        value: "processing",
        icon: <Loader2 size={16} />,
      },
      {
        name: "Completed",
        value: "completed",
        icon: <Check size={16} />,
      },
    ];

    const currentIndex = steps.findIndex(
      (step) => step.value === currentStatus
    );

    return (
      <div className="mt-6">
        <p className="mb-4 text-sm font-semibold text-slate-800">
          Request Status
        </p>

        <div className="flex items-center">
          {steps.map((step, index) => {
            const isCompleted =
              currentIndex >= 0 && index <= currentIndex;

            const isCurrent = currentIndex === index;

            return (
              <div
                key={step.value}
                className="flex flex-1 items-center"
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step.icon}
                  </div>

                  <p
                    className={`mt-2 text-xs font-semibold ${
                      isCurrent
                        ? "text-blue-700"
                        : isCompleted
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.name}
                  </p>

                  {isCurrent && (
                    <p className="mt-1 text-[10px] font-medium text-blue-600">
                      Current
                    </p>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-1 flex-1 rounded ${
                      currentIndex > index
                        ? "bg-blue-600"
                        : "bg-slate-100"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">

          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-slate-900"
          >
            <ArrowLeft size={17} />
            eBarangay Connect
          </Link>

          <span className="text-sm font-semibold text-slate-600">
            My Requests
          </span>

        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-5xl px-6 py-10">

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            My Requests
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Track the status and history of your barangay document requests.
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

        {/* REQUESTS */}
        <div className="mt-8">

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500">
                Loading requests...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

              <p className="font-semibold text-slate-700">
                No document requests found.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                You have not submitted any document requests yet.
              </p>

              <Link
                href="/requests/new"
                className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create New Request
              </Link>

            </div>
          ) : (
            <div className="space-y-6">

              {requests.map((request) => {
                const requestHistory =
                  getRequestHistory(request.id);

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >

                    {/* REQUEST INFO */}
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">

                      <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Request #{request.id}
                        </p>

                        <h2 className="mt-1 text-xl font-bold text-slate-900">
                          {getDocumentName(request)}
                        </h2>

                        <p className="mt-2 text-sm text-slate-600">
                          <span className="font-semibold">
                            Purpose:
                          </span>{" "}
                          {request.purpose || "No purpose provided."}
                        </p>

                      </div>

                      <div>

                        <span
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(
                            request.status
                          )}`}
                        >
                          {request.status || "Pending"}
                        </span>

                      </div>

                    </div>

                    {/* STATUS TRACKER */}
                    {renderStatusTracker(request.status)}

                    {/* HISTORY */}
                    <div className="mt-8 border-t border-slate-100 pt-6">

                      <h3 className="text-lg font-bold text-slate-900">
                        Status History
                      </h3>

                      {historyLoading ? (
                        <p className="mt-4 text-sm text-slate-500">
                          Loading history...
                        </p>
                      ) : requestHistory.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">
                          No status history available.
                        </p>
                      ) : (
                        <div className="mt-5 space-y-4">

                          {requestHistory.map(
                            (historyItem, index) => (
                              <div
                                key={historyItem.id}
                                className="flex gap-4"
                              >

                                {/* ICON */}
                                <div className="flex flex-col items-center">

                                  <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-full ${getHistoryIconStyle(
                                      historyItem.status
                                    )}`}
                                  >
                                    {getHistoryIcon(
                                      historyItem.status
                                    )}
                                  </div>

                                  {index <
                                    requestHistory.length - 1 && (
                                    <div className="mt-2 h-full w-px bg-slate-200" />
                                  )}

                                </div>

                                {/* DETAILS */}
                                <div className="pb-4">

                                  <p className="font-semibold text-slate-900">
                                    {historyItem.status}
                                  </p>

                                  <p className="mt-1 text-sm text-slate-600">
                                    {historyItem.remarks ||
                                      "No remarks provided."}
                                  </p>

                                </div>

                              </div>
                            )
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </section>

    </main>
  );
}