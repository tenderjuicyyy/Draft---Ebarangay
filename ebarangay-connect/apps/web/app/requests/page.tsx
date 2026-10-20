
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Ban,
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

function getDocumentName(request: RequestItem): string {
  if (Array.isArray(request.document_types)) {
    return request.document_types[0]?.name || "Unknown Document";
  }

  return request.document_types?.name || "Unknown Document";
}

function normalizedStatus(status: string | null): string {
  const value = status?.toLowerCase() || "pending";

  if (value === "ready for claiming") {
    return "completed";
  }

  return value;
}

function getStatusStyle(status: string | null): string {
  switch (normalizedStatus(status)) {
    case "completed":
    case "claimed":
    case "approved":
      return "bg-[#e6f2eb] text-[#28724e]";

    case "processing":
      return "bg-[#e5eff9] text-[#255e91]";

    case "rejected":
      return "bg-[#fae9e6] text-[#a9473c]";

    case "cancelled":
      return "bg-[#edf0f2] text-[#60717f]";

    default:
      return "bg-[#fbf1d9] text-[#8e6b25]";
  }
}

function getStatusIcon(status: string | null) {
  switch (normalizedStatus(status)) {
    case "completed":
    case "claimed":
    case "approved":
      return <CheckCircle2 size={15} />;

    case "processing":
      return <Loader2 size={15} />;

    case "rejected":
      return <XCircle size={15} />;

    case "cancelled":
      return <Ban size={15} />;

    default:
      return <Clock size={15} />;
  }
}

function getHistoryIcon(status: string) {
  switch (normalizedStatus(status)) {
    case "completed":
    case "claimed":
    case "approved":
      return <Check size={16} />;

    case "processing":
      return <Loader2 size={16} />;

    case "rejected":
      return <X size={16} />;

    case "cancelled":
      return <Ban size={16} />;

    default:
      return <Clock size={16} />;
  }
}

function getHistoryIconStyle(status: string): string {
  return getStatusStyle(status);
}

function StatusTracker({
  status,
}: {
  status: string | null;
}) {
  const currentStatus = normalizedStatus(status);

  if (
    currentStatus === "rejected" ||
    currentStatus === "cancelled"
  ) {
    const isRejected = currentStatus === "rejected";

    return (
      <div
        className={`mt-7 border-l-4 p-5 ${
          isRejected
            ? "border-[#b74d3d] bg-[#fdf0ed]"
            : "border-[#8193a2] bg-[#f1f4f6]"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center ${
              isRejected
                ? "bg-[#fae0da] text-[#a9473c]"
                : "bg-[#e3e9ee] text-[#60717f]"
            }`}
          >
            {isRejected ? <X size={20} /> : <Ban size={20} />}
          </div>

          <div>
            <p
              className={`font-black ${
                isRejected
                  ? "text-[#943d31]"
                  : "text-[#526575]"
              }`}
            >
              Request {isRejected ? "Rejected" : "Cancelled"}
            </p>

            <p
              className={`mt-2 text-sm leading-7 ${
                isRejected
                  ? "text-[#943d31]"
                  : "text-[#526575]"
              }`}
            >
              {isRejected
                ? "This request has been rejected by the barangay."
                : "This request has been cancelled."}{" "}
              Check the status history below for additional remarks.
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

  const currentIndex =
    currentStatus === "claimed"
      ? 2
      : currentStatus === "approved"
        ? 1
        : steps.findIndex(
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
            currentIndex >= 0 && index <= currentIndex;

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


function StatCard({
  title,
  count,
  icon: Icon,
  background,
  iconColor,
}: {
  title: string;
  count: number;
  icon: typeof Clock;
  background: string;
  iconColor: string;
}) {
  return (
    <div className="flex min-h-41.5 flex-col border border-[#dce3e8] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={`flex h-11 w-11 items-center justify-center ${background} ${iconColor}`}
      >
        <Icon size={21} strokeWidth={1.9} />
      </div>

      <p className="mt-5 text-[28px] font-black leading-none text-[#0b304b]">
        {count}
      </p>

      <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.04em] text-[#58738a]">
        {title}
      </p>
    </div>
  );
}

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

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function getRequestHistory(requestId: number) {
    return history.filter(
      (item) => item.request_id === requestId
    );
  }


  const pendingCount = requests.filter(
    (request) =>
      normalizedStatus(request.status) === "pending"
  ).length;

  const processingCount = requests.filter(
    (request) =>
      normalizedStatus(request.status) === "processing"
  ).length;

  const completedCount = requests.filter(
    (request) =>
      normalizedStatus(request.status) === "completed"
  ).length;

  const rejectedCount = requests.filter(
    (request) =>
      normalizedStatus(request.status) === "rejected"
  ).length;

  const cancelledCount = requests.filter(
    (request) =>
      normalizedStatus(request.status) === "cancelled"
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-6 font-sans">
        <div className="text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-[#0b304b]" />

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


      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
              <Landmark size={23} strokeWidth={1.7} />
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


      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{
            backgroundImage: "url('/barangay-hall.jpg')",
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


      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
        >

        </Link>


        <section className="mb-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Total Requests"
            count={requests.length}
            icon={FileText}
            background="bg-[#e8eef3]"
            iconColor="text-[#0b304b]"
          />

          <StatCard
            title="Pending"
            count={pendingCount}
            icon={Clock}
            background="bg-[#fbf1d9]"
            iconColor="text-[#8e6b25]"
          />

          <StatCard
            title="Processing"
            count={processingCount}
            icon={Loader2}
            background="bg-[#e5eff9]"
            iconColor="text-[#255e91]"
          />

          <StatCard
            title="Completed"
            count={completedCount}
            icon={CheckCircle2}
            background="bg-[#e6f2eb]"
            iconColor="text-[#28724e]"
          />

          <StatCard
            title="Rejected"
            count={rejectedCount}
            icon={XCircle}
            background="bg-[#fae9e6]"
            iconColor="text-[#a9473c]"
          />

          <StatCard
            title="Cancelled"
            count={cancelledCount}
            icon={Ban}
            background="bg-[#edf0f2]"
            iconColor="text-[#60717f]"
          />
        </section>


        {errorMessage && (
          <div
            role="alert"
            className="mb-8 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">
              Something went wrong
            </p>

            <p className="mt-2 break-word text-sm leading-7 text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        )}


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
              const requestHistory = getRequestHistory(
                request.id
              );

              return (
                <article
                  key={request.id}
                  className="overflow-hidden border border-[#dce3e8] bg-white shadow-sm"
                >

                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                          <FileText size={22} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b7b40]">
                            Request #{request.id}
                          </p>

                          <h3 className="mt-2 break-word text-xl font-black text-[#0b304b] sm:text-2xl">
                            {getDocumentName(request)}
                          </h3>

                          <p className="mt-4 max-w-2xl break-word text-sm leading-7 text-[#697d8c]">
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


                    <StatusTracker status={request.status} />


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
                                  requestHistory.length -
                                    1 && (
                                  <div className="my-2 min-h-8 w-px flex-1 bg-[#d5dfe7]" />
                                )}
                              </div>

                              <div className="pb-7">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="font-black text-[#0b304b]">
                                    {historyItem.status}
                                  </p>

                                  {index ===
                                    requestHistory.length -
                                      1 && (
                                    <span className="bg-[#e8eef3] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#0b304b]">
                                      Latest
                                    </span>
                                  )}
                                </div>

                                <p className="mt-2 max-w-2xl break-word text-sm leading-7 text-[#697d8c]">
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


      <footer className="border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </div>
      </footer>
    </main>
  );
}
