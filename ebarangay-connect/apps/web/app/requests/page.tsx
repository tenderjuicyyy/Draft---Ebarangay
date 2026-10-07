"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FilePlus2,
  FileText,
  Home,
  Loader2,
  X,
  XCircle,
} from "lucide-react";
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

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setHistoryLoading(true);
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (sessionError || !session) {
        if (sessionError) {
          console.error("AUTH ERROR:", sessionError);
        }

        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      const { data: requestData, error: requestError } =
        await supabase
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

      if (cancelled) {
        return;
      }

      if (requestError) {
        setErrorMessage(
          `REQUEST ERROR: ${requestError.message}`
        );
        setLoading(false);
        setHistoryLoading(false);
        return;
      }

      const loadedRequests =
        (requestData as RequestItem[]) || [];

      setRequests(loadedRequests);
      setLoading(false);

      if (loadedRequests.length === 0) {
        setHistory([]);
        setHistoryLoading(false);
        return;
      }

      const requestIds = loadedRequests.map(
        (request) => request.id
      );

      const { data: historyData, error: historyError } =
        await supabase
          .from("request_status_history")
          .select(`
            id,
            request_id,
            status,
            remarks
          `)
          .in("request_id", requestIds)
          .order("id", { ascending: true });

      if (cancelled) {
        return;
      }

      if (historyError) {
        setErrorMessage(
          `HISTORY ERROR: ${historyError.message}`
        );
        setHistoryLoading(false);
        return;
      }

      setHistory((historyData as HistoryItem[]) || []);
      setHistoryLoading(false);
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function getDocumentName(request: RequestItem) {
    if (Array.isArray(request.document_types)) {
      return (
        request.document_types[0]?.name ||
        "Unknown Document"
      );
    }

    return (
      request.document_types?.name ||
      "Unknown Document"
    );
  }

  function getStatusStyle(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-[#dfe9d5] text-[#435332]";

      case "processing":
        return "bg-[#e9e3cd] text-[#6b6037]";

      case "rejected":
        return "bg-[#f3ddd5] text-[#9a4f3c]";

      case "pending":
      default:
        return "bg-[#f4e7cf] text-[#9a672e]";
    }
  }

  function getStatusIcon(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle2 size={15} />;

      case "processing":
        return <Loader2 size={15} />;

      case "rejected":
        return <XCircle size={15} />;

      case "pending":
      default:
        return <Clock size={15} />;
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
        return "bg-[#dfe9d5] text-[#435332]";

      case "processing":
        return "bg-[#e9e3cd] text-[#6b6037]";

      case "rejected":
        return "bg-[#f3ddd5] text-[#9a4f3c]";

      case "pending":
      default:
        return "bg-[#f4e7cf] text-[#9a672e]";
    }
  }

  function getRequestHistory(requestId: number) {
    return history.filter(
      (item) => item.request_id === requestId
    );
  }

  function renderStatusTracker(status: string | null) {
    const currentStatus =
      status?.toLowerCase() || "pending";

    if (currentStatus === "rejected") {
      return (
        <div className="mt-6 rounded-2xl border border-[#dfb9aa] bg-[#f7e5de] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3d4ca] text-[#9a4f3c]">
              <X size={18} />
            </div>

            <div>
              <p className="font-black text-[#8d4938]">
                Request Rejected
              </p>

              <p className="mt-1 text-sm leading-6 text-[#9b5a49]">
                This request has been rejected by the
                barangay. Check the status history below
                for additional remarks.
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
      <div className="mt-7">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-black text-[#34372b]">
            Request Status
          </p>

          <span className="text-xs font-semibold text-[#858273]">
            {status || "Pending"}
          </span>
        </div>

        <div className="flex items-start">
          {steps.map((step, index) => {
            const isCompleted =
              currentIndex >= 0 &&
              index <= currentIndex;

            const isCurrent =
              currentIndex === index;

            return (
              <div
                key={step.value}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-16 flex-col items-center text-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                      isCompleted
                        ? "bg-[#59613f] text-white"
                        : "bg-[#e8e2d5] text-[#aaa697]"
                    }`}
                  >
                    {step.icon}
                  </div>

                  <p
                    className={`mt-2 text-xs font-bold ${
                      isCurrent
                        ? "text-[#505738]"
                        : isCompleted
                          ? "text-[#666858]"
                          : "text-[#aaa697]"
                    }`}
                  >
                    {step.name}
                  </p>

                  {isCurrent && (
                    <span className="mt-1 text-[10px] font-black uppercase tracking-wide text-[#c96f46]">
                      Current
                    </span>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 mt-5 h-1 flex-1 rounded-full ${
                      currentIndex > index
                        ? "bg-[#59613f]"
                        : "bg-[#e4ded0]"
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

  const pendingCount = requests.filter(
    (request) =>
      request.status?.toLowerCase() === "pending"
  ).length;

  const processingCount = requests.filter(
    (request) =>
      request.status?.toLowerCase() ===
      "processing"
  ).length;

  const completedCount = requests.filter(
    (request) =>
      request.status?.toLowerCase() ===
      "completed"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f0e4] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4d5435] text-[#f7f2e7]">
            <Loader2
              size={27}
              className="animate-spin"
            />
          </div>

          <p className="mt-5 text-lg font-black text-[#25281e]">
            Loading your requests
          </p>

          <p className="mt-1 text-sm text-[#777465]">
            Getting your document request activity
            ready.
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

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full border border-[#d3ccba] px-5 py-2.5 text-sm font-bold text-[#555548] transition hover:bg-[#ebe5d7] sm:inline-flex"
              >
                <ArrowLeft size={16} />
                Dashboard
              </Link>

              <Link
                href="/requests/new"
                className="inline-flex items-center gap-2 rounded-full bg-[#c96f46] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#b8613d] sm:px-5"
              >
                <FilePlus2 size={16} />

                <span className="hidden sm:inline">
                  New Request
                </span>

                <span className="sm:hidden">
                  New
                </span>
              </Link>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#696958] transition hover:text-[#b55f3b]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          {/* HERO */}
          <section className="mt-6 overflow-hidden rounded-4xl bg-[#4d5435] text-[#f7f2e7]">
            <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
              <div>
                <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                  <FileText size={14} />

                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#d7d8c5]">
                    Resident Portal
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  My Requests
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d4d5c5] sm:text-base">
                  Track your barangay document
                  requests, follow their processing
                  status, and review updates from the
                  barangay.
                </p>
              </div>

              <Link
                href="/requests/new"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#c96f46] px-6 py-3 text-sm font-black text-white transition hover:bg-[#b8613d]"
              >
                Create New Request
                <ArrowRight size={17} />
              </Link>
            </div>
          </section>

          {/* STATS */}
          <section className="grid grid-cols-2 gap-3 py-6 lg:grid-cols-4">
            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <p className="text-3xl font-black">
                {requests.length}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Total Requests
              </p>
            </div>

            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <p className="text-3xl font-black text-[#9a672e]">
                {pendingCount}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Pending
              </p>
            </div>

            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <p className="text-3xl font-black text-[#6b6037]">
                {processingCount}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Processing
              </p>
            </div>

            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <p className="text-3xl font-black text-[#435332]">
                {completedCount}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Completed
              </p>
            </div>
          </section>

          {/* ERROR */}
          {errorMessage && (
            <div className="mb-6 rounded-3xl border border-[#dfb9aa] bg-[#f7e5de] p-5">
              <p className="font-black text-[#8d4938]">
                Something went wrong
              </p>

              <p className="mt-1 wrap-break-word text-sm leading-6 text-[#9b5a49]">
                {errorMessage}
              </p>
            </div>
          )}

          {/* REQUESTS */}
          {requests.length === 0 ? (
            <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                <FileText size={25} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                No document requests yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777465]">
                Once you submit a barangay document
                request, you will be able to track its
                progress and status history here.
              </p>

              <Link
                href="/requests/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#c96f46] px-6 py-3 text-sm font-black text-white transition hover:bg-[#b8613d]"
              >
                Create New Request
                <ArrowRight size={16} />
              </Link>
            </section>
          ) : (
            <section className="space-y-5">
              {requests.map((request) => {
                const requestHistory =
                  getRequestHistory(request.id);

                return (
                  <article
                    key={request.id}
                    className="overflow-hidden rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea]"
                  >
                    {/* REQUEST TOP */}
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div className="flex gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8e3d5] text-[#616849]">
                            <FileText size={21} />
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a8778]">
                              Request #{request.id}
                            </p>

                            <h2 className="mt-1 text-xl font-black text-[#292c21] sm:text-2xl">
                              {getDocumentName(
                                request
                              )}
                            </h2>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#706f62]">
                              <span className="font-black text-[#4f5143]">
                                Purpose:
                              </span>{" "}
                              {request.purpose ||
                                "No purpose provided."}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${getStatusStyle(
                            request.status
                          )}`}
                        >
                          {getStatusIcon(
                            request.status
                          )}
                          {request.status ||
                            "Pending"}
                        </span>
                      </div>

                      {/* TRACKER */}
                      {renderStatusTracker(
                        request.status
                      )}

                      {/* NEW VIEW DETAILS BUTTON */}
                      <div className="mt-7 border-t border-[#ded7c6] pt-5">
                        <Link
                          href={`/requests/${request.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#4d5435] px-5 py-3 text-sm font-black text-white transition hover:bg-[#41482d]"
                        >
                          View Request Details
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>

                    {/* HISTORY */}
                    <div className="border-t border-[#ded7c6] bg-[#f4f0e6] p-6 sm:p-8">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b8058]">
                          Activity
                        </p>

                        <h3 className="mt-1 text-lg font-black text-[#303328]">
                          Status History
                        </h3>
                      </div>

                      {historyLoading ? (
                        <div className="mt-5 flex items-center gap-2 text-sm text-[#777465]">
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Loading history...
                        </div>
                      ) : requestHistory.length ===
                        0 ? (
                        <p className="mt-5 text-sm text-[#777465]">
                          No status history
                          available.
                        </p>
                      ) : (
                        <div className="mt-6">
                          {requestHistory.map(
                            (
                              historyItem,
                              index
                            ) => (
                              <div
                                key={
                                  historyItem.id
                                }
                                className="flex gap-4"
                              >
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getHistoryIconStyle(
                                      historyItem.status
                                    )}`}
                                  >
                                    {getHistoryIcon(
                                      historyItem.status
                                    )}
                                  </div>

                                  {index <
                                    requestHistory.length -
                                      1 && (
                                    <div className="my-2 min-h-8 w-px flex-1 bg-[#d7d0bf]" />
                                  )}
                                </div>

                                <div className="pb-6">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-black text-[#303328]">
                                      {
                                        historyItem.status
                                      }
                                    </p>

                                    {index ===
                                      requestHistory.length -
                                        1 && (
                                      <span className="rounded-full bg-[#e3e6d6] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#5b6442]">
                                        Latest
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#706f62]">
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
                  </article>
                );
              })}
            </section>
          )}
        </div>

        {/* FOOTER */}
        <footer className="border-t border-[#d9d2c1] bg-[#f7f3e9] px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 text-xs text-[#858273] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 eBarangay Connect</p>
            <p>
              Digital barangay services for residents.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}