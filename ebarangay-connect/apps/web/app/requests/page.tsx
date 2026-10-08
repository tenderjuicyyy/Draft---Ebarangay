
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
  FileText,
  Landmark,
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
    | { name: string }
    | { name: string }[]
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

  // AUTHENTICATION AND REQUEST FETCHING
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

      if (cancelled) return;

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

      if (cancelled) return;

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

      if (cancelled) return;

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
        return "bg-[#e6f2eb] text-[#28724e]";

      case "processing":
        return "bg-[#e5eff9] text-[#255e91]";

      case "rejected":
        return "bg-[#fae9e6] text-[#a9473c]";

      case "pending":
      default:
        return "bg-[#fbf1d9] text-[#8e6b25]";
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
        return "bg-[#e6f2eb] text-[#28724e]";

      case "processing":
        return "bg-[#e5eff9] text-[#255e91]";

      case "rejected":
        return "bg-[#fae9e6] text-[#a9473c]";

      case "pending":
      default:
        return "bg-[#fbf1d9] text-[#8e6b25]";
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
        <div className="mt-7 border-l-4 border-[#b74d3d] bg-[#fdf0ed] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#fae0da] text-[#a9473c]">
              <X size={20} />
            </div>

            <div>
              <p className="font-black text-[#943d31]">
                Request Rejected
              </p>

              <p className="mt-2 text-sm leading-7 text-[#943d31]">
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
        icon: <Clock size={17} />,
      },
      {
        name: "Processing",
        value: "processing",
        icon: <Loader2 size={17} />,
      },
      {
        name: "Completed",
        value: "completed",
        icon: <Check size={17} />,
      },
    ];

    const currentIndex = steps.findIndex(
      (step) => step.value === currentStatus
    );

    return (
      <div className="mt-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-sm font-black text-[#0b304b]">
            Request Status
          </p>

          <span className="text-xs font-bold text-[#718391]">
            {status || "Pending"}
          </span>
        </div>

        <div className="flex items-start">
          {steps.map((step, index) => {
            const isCompleted =
              currentIndex >= 0 &&
              index <= currentIndex;

            const isCurrent = currentIndex === index;

            return (
              <div
                key={step.value}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-16 flex-col items-center text-center">
                  <div
                    className={`flex h-11 w-11 items-center justify-center border transition ${
                      isCompleted
                        ? "border-[#0b304b] bg-[#0b304b] text-white"
                        : "border-[#dce3e8] bg-[#edf2f5] text-[#a0afba]"
                    }`}
                  >
                    {step.icon}
                  </div>

                  <p
                    className={`mt-3 text-xs font-bold ${
                      isCurrent
                        ? "text-[#0b304b]"
                        : isCompleted
                        ? "text-[#47667c]"
                        : "text-[#9babb6]"
                    }`}
                  >
                    {step.name}
                  </p>

                  {isCurrent && (
                    <span className="mt-2 text-[10px] font-black uppercase tracking-wide text-[#9b7b40]">
                      Current
                    </span>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 mt-5 h-1 flex-1 ${
                      currentIndex > index
                        ? "bg-[#d5bd81]"
                        : "bg-[#e3e9ee]"
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
      request.status?.toLowerCase() === "processing"
  ).length;

  const completedCount = requests.filter(
    (request) =>
      request.status?.toLowerCase() === "completed"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-6 font-sans">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#0b304b] text-white">
            <Loader2
              size={28}
              className="animate-spin"
            />
          </div>

          <p className="mt-5 text-lg font-black text-[#0b304b]">
            Loading your requests
          </p>

          <p className="mt-2 text-sm text-[#697d8c]">
            Getting your document request activity ready.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP GOVERNMENT BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7d7e3] sm:text-xs">
            Digital Citizen Services Portal
          </span>

          <span className="hidden text-xs text-[#c7d7e3] sm:block">
            eBarangay Connect
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
              <Landmark
                size={23}
                strokeWidth={1.7}
              />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5bd81]">
                Digital Barangay Portal
              </p>

              <p className="mt-1 text-lg font-black tracking-tight sm:text-xl">
                eBarangay Connect
              </p>
            </div>
          </Link>

          {/* DASHBOARD BUTTON ONLY */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 border border-white/30 px-5 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b]"
            >
              <ArrowLeft size={16} />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{
            backgroundImage:
              "url('/barangay-hall.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-[#061b2b]/95 via-[#0b304b]/90 to-[#0b304b]/75" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#d5bd81]" />

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e2c991]">
              Resident Portal
            </p>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            My Requests
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
            Track your barangay document requests, follow
            their processing status, and review updates
            from the barangay.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
        >
          
        </Link>

        {/* STATISTICS */}
        <section className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="border border-[#dce3e8] bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
              <FileText size={19} />
            </div>

            <p className="mt-5 text-3xl font-black text-[#0b304b]">
              {requests.length}
            </p>

            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#718391]">
              Total Requests
            </p>
          </div>

          <div className="border border-[#dce3e8] bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center bg-[#fbf1d9] text-[#8e6b25]">
              <Clock size={19} />
            </div>

            <p className="mt-5 text-3xl font-black text-[#0b304b]">
              {pendingCount}
            </p>

            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#718391]">
              Pending
            </p>
          </div>

          <div className="border border-[#dce3e8] bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center bg-[#e5eff9] text-[#255e91]">
              <Loader2 size={19} />
            </div>

            <p className="mt-5 text-3xl font-black text-[#0b304b]">
              {processingCount}
            </p>

            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#718391]">
              Processing
            </p>
          </div>

          <div className="border border-[#dce3e8] bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center bg-[#e6f2eb] text-[#28724e]">
              <CheckCircle2 size={19} />
            </div>

            <p className="mt-5 text-3xl font-black text-[#0b304b]">
              {completedCount}
            </p>

            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#718391]">
              Completed
            </p>
          </div>
        </section>

        {/* ERROR */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-8 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">
              Something went wrong
            </p>

            <p className="mt-2 wrap-break-word text-sm leading-7 text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        )}

        {/* REQUEST LIST */}
        {requests.length === 0 ? (
          <section className="border border-[#dce3e8] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
              <FileText size={27} />
            </div>

            <h2 className="mt-6 text-xl font-black text-[#0b304b]">
              No document requests yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#697d8c]">
              Once you submit a barangay document request,
              you will be able to track its progress and
              status history here.
            </p>

            <Link
              href="/requests/new"
              className="mt-7 inline-flex items-center gap-2 bg-[#0b304b] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70]"
            >
              Create New Request
              <ArrowRight size={16} />
            </Link>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                Request Activity
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#0b304b]">
                Your Document Requests
              </h2>
            </div>

            {requests.map((request) => {
              const requestHistory =
                getRequestHistory(request.id);

              return (
                <article
                  key={request.id}
                  className="overflow-hidden border border-[#dce3e8] bg-white shadow-sm"
                >
                  {/* REQUEST INFORMATION */}
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                          <FileText size={22} />
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b7b40]">
                            Request #{request.id}
                          </p>

                          <h3 className="mt-2 text-xl font-black text-[#0b304b] sm:text-2xl">
                            {getDocumentName(request)}
                          </h3>

                          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#697d8c]">
                            <span className="font-black text-[#0b304b]">
                              Purpose:
                            </span>{" "}
                            {request.purpose ||
                              "No purpose provided."}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center gap-2 px-4 py-2 text-xs font-black ${getStatusStyle(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status || "Pending"}
                      </span>
                    </div>

                    {/* STATUS TRACKER */}
                    {renderStatusTracker(request.status)}

                    {/* REQUEST DETAILS LINK */}
                    <div className="mt-8 border-t border-[#e3e9ee] pt-6">
                      <Link
                        href={`/requests/${request.id}`}
                        className="inline-flex items-center gap-2 bg-[#0b304b] px-6 py-3 text-sm font-black text-white transition hover:bg-[#174b70]"
                      >
                        View Request Details
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>

                  {/* STATUS HISTORY */}
                  <div className="border-t border-[#e3e9ee] bg-[#f8fafc] p-6 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b7b40]">
                      Activity
                    </p>

                    <h4 className="mt-2 text-lg font-black text-[#0b304b]">
                      Status History
                    </h4>

                    {historyLoading ? (
                      <div className="mt-6 flex items-center gap-2 text-sm text-[#718391]">
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Loading history...
                      </div>
                    ) : requestHistory.length === 0 ? (
                      <p className="mt-6 text-sm text-[#718391]">
                        No status history available.
                      </p>
                    ) : (
                      <div className="mt-7">
                        {requestHistory.map(
                          (historyItem, index) => (
                            <div
                              key={historyItem.id}
                              className="flex gap-4"
                            >
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center ${getHistoryIconStyle(
                                    historyItem.status
                                  )}`}
                                >
                                  {getHistoryIcon(
                                    historyItem.status
                                  )}
                                </div>

                                {index <
                                  requestHistory.length - 1 && (
                                  <div className="my-2 min-h-8 w-px flex-1 bg-[#d5dfe7]" />
                                )}
                              </div>

                              <div className="pb-7">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-black text-[#0b304b]">
                                    {historyItem.status}
                                  </p>

                                  {index ===
                                    requestHistory.length - 1 && (
                                    <span className="bg-[#e8eef3] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#0b304b]">
                                      Latest
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#697d8c]">
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
      <footer className="border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </div>
      </footer>
    </main>
  );
}
