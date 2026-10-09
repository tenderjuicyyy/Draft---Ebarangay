
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Landmark,
  Loader2,
  QrCode,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";

type DocumentType = {
  name: string;
  processing_days: number | null;
  fee: number | null;
};

type RequestItem = {
  id: number;
  profile_id: string;
  document_type_id: number;
  purpose: string | null;
  status: string | null;
  claim_token: string | null;
  claimed_at: string | null;
  document_types: DocumentType | DocumentType[] | null;
};

type HistoryItem = {
  id: number;
  request_id: number;
  status: string;
  remarks: string | null;
};

const requestFields = `
  id,
  profile_id,
  document_type_id,
  purpose,
  status,
  claim_token,
  claimed_at,
  document_types (
    name,
    processing_days,
    fee
  )
`;

function statusStyle(status: string | null) {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-[#e6f2eb] text-[#28724e]";
    case "processing":
      return "bg-[#e5eff9] text-[#255e91]";
    case "rejected":
      return "bg-[#fae9e6] text-[#a9473c]";
    case "cancelled":
      return "bg-[#eceff1] text-[#566775]";
    default:
      return "bg-[#fbf1d9] text-[#8e6b25]";
  }
}

function StatusIcon({
  status,
  size = 16,
}: {
  status: string | null;
  size?: number;
}) {
  switch (status?.toLowerCase()) {
    case "completed":
      return <CheckCircle2 size={size} />;
    case "processing":
      return <Loader2 size={size} />;
    case "rejected":
      return <XCircle size={size} />;
    case "cancelled":
      return <Ban size={size} />;
    default:
      return <Clock size={size} />;
  }
}

function StatusTracker({ status }: { status: string | null }) {
  const currentStatus = status?.toLowerCase() || "pending";

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
              This request has been rejected by the barangay.
              Review the status history below for any remarks provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "cancelled") {
    return (
      <div className="mt-7 border-l-4 border-[#718391] bg-[#edf2f5] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#dce5eb] text-[#566775]">
            <Ban size={20} />
          </div>
          <div>
            <p className="font-black text-[#0b304b]">
              Request Cancelled
            </p>
            <p className="mt-2 text-sm leading-7 text-[#697d8c]">
              You cancelled this request. It will no longer
              continue through barangay processing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { name: "Pending", value: "pending", icon: Clock },
    { name: "Processing", value: "processing", icon: Loader2 },
    { name: "Completed", value: "completed", icon: Check },
  ];

  const currentIndex = steps.findIndex(
    (step) => step.value === currentStatus
  );

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm font-black text-[#0b304b]">
          Request Progress
        </p>
        <span className="text-xs font-bold text-[#718391]">
          {status || "Pending"}
        </span>
      </div>

      <div className="flex items-start">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentIndex >= index;
          const isCurrent = currentIndex === index;

          return (
            <div key={step.value} className="flex flex-1 items-start">
              <div className="flex min-w-16 flex-col items-center text-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center border ${
                    isCompleted
                      ? "border-[#0b304b] bg-[#0b304b] text-white"
                      : "border-[#dce3e8] bg-[#edf2f5] text-[#a0afba]"
                  }`}
                >
                  <Icon size={17} />
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

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [request, setRequest] = useState<RequestItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRequest() {
      setLoading(true);
      setErrorMessage("");
      setNotFound(false);

      if (!Number.isInteger(id) || id <= 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (sessionError || !session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      const { data, error } = await supabase
        .from("document_requests")
        .select(requestFields)
        .eq("id", id)
        .eq("profile_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("REQUEST ERROR:", error);
        setErrorMessage(`REQUEST ERROR: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data) {
        setRequest(null);
        setHistory([]);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRequest(data as unknown as RequestItem);

      const { data: historyData, error: historyError } =
        await supabase
          .from("request_status_history")
          .select("id, request_id, status, remarks")
          .eq("request_id", id)
          .order("id", { ascending: true });

      if (cancelled) return;

      if (historyError) {
        console.error("HISTORY ERROR:", historyError);
        setErrorMessage(`HISTORY ERROR: ${historyError.message}`);
        setHistory([]);
      } else {
        setHistory((historyData as HistoryItem[]) || []);
      }

      setLoading(false);
    }

    loadRequest();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function handleCancelRequest() {
    if (!request) return;

    if (request.status?.toLowerCase() !== "pending") {
      setErrorMessage("Only pending requests can be cancelled.");
      setShowCancelModal(false);
      return;
    }

    setCancelling(true);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setCancelling(false);
      router.replace("/login");
      return;
    }

    const userId = session.user.id;

    const { error: updateError } = await supabase
      .from("document_requests")
      .update({ status: "Cancelled" })
      .eq("id", request.id)
      .eq("profile_id", userId)
      .eq("status", "Pending");

    if (updateError) {
      setErrorMessage(`CANCEL ERROR: ${updateError.message}`);
      setCancelling(false);
      return;
    }

    const { data: updatedRequest, error: verifyError } =
      await supabase
        .from("document_requests")
        .select(requestFields)
        .eq("id", request.id)
        .eq("profile_id", userId)
        .maybeSingle();

    if (verifyError) {
      setErrorMessage(`VERIFY ERROR: ${verifyError.message}`);
      setCancelling(false);
      return;
    }

    if (
      !updatedRequest ||
      updatedRequest.status?.toLowerCase() !== "cancelled"
    ) {
      setErrorMessage(
        "The request could not be cancelled. It may no longer be pending. Please refresh the page."
      );
      setCancelling(false);
      return;
    }

    const { data: newHistory, error: historyError } =
      await supabase
        .from("request_status_history")
        .insert({
          request_id: request.id,
          status: "Cancelled",
          remarks: "Request cancelled by resident.",
        })
        .select("id, request_id, status, remarks")
        .maybeSingle();

    setRequest(updatedRequest as unknown as RequestItem);
    setShowCancelModal(false);
    setCancelling(false);

    if (historyError) {
      setErrorMessage(
        `The request was cancelled, but the cancellation history could not be saved: ${historyError.message}`
      );
      return;
    }

    if (newHistory) {
      setHistory((current) => [
        ...current,
        newHistory as HistoryItem,
      ]);
    }

    setSuccessMessage(
      "Your request has been cancelled successfully."
    );
  }

  const documentType = Array.isArray(request?.document_types)
    ? request.document_types[0] || null
    : request?.document_types || null;

  const canCancel =
    request?.status?.toLowerCase() === "pending";

  const isCompleted =
    request?.status?.toLowerCase() === "completed";

  const isClaimed = Boolean(request?.claimed_at);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-6 font-sans">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#0b304b] text-white">
            <Loader2 size={28} className="animate-spin" />
          </div>

          <p className="mt-5 text-lg font-black text-[#0b304b]">
            Loading request details
          </p>

          <p className="mt-2 text-sm text-[#697d8c]">
            Getting your document request information.
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
          <Link href="/dashboard" className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
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

          {/* KEEP THE RIGHT-SIDE MY REQUESTS BUTTON */}
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">My Requests</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* PAGE HERO */}
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
            Request Details
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
            Review your document request, processing status,
            and updates from your barangay.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT — REDUNDANT LEFT-SIDE BACK LINK REMOVED */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
        {/* ERROR */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-6 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">
              Something went wrong
            </p>
            <p className="mt-2 wrap-break-words text-sm leading-7 text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {successMessage && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 border-l-4 border-[#357c60] bg-[#edf7f1] px-6 py-5"
          >
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0 text-[#357c60]"
            />

            <div>
              <p className="font-black text-[#245e48]">
                Request Updated
              </p>
              <p className="mt-2 text-sm leading-7 text-[#376a55]">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {notFound || !request ? (
          <section className="mt-7 border border-[#dce3e8] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
              <FileText size={27} />
            </div>

            <h2 className="mt-6 text-2xl font-black text-[#0b304b]">
              Request not found
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#697d8c]">
              This request does not exist or it does not
              belong to your account.
            </p>

            <Link
              href="/requests"
              className="mt-7 inline-flex items-center gap-2 bg-[#0b304b] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70]"
            >
              <ArrowLeft size={16} />
              Return to My Requests
            </Link>
          </section>
        ) : (
          <>
            {/* REQUEST SUMMARY */}
            <section className="mt-7 bg-[#0b304b] p-7 text-white sm:p-9">
              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e2c991]">
                    Request #{request.id}
                  </p>

                  <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                    {documentType?.name || "Unknown Document"}
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c7d7e3]">
                    Review your request information, current
                    processing status, and barangay updates.
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-2 px-4 py-2 text-sm font-black ${statusStyle(
                    request.status
                  )}`}
                >
                  <StatusIcon status={request.status} />
                  {request.status || "Pending"}
                </span>
              </div>
            </section>

            <div className="mt-7 grid gap-7 lg:grid-cols-[1.25fr_0.75fr]">
              {/* LEFT COLUMN */}
              <div className="space-y-7">
                {/* DOCUMENT INFORMATION */}
                <section className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                    Request Information
                  </p>

                  <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                    Document Details
                  </h2>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="bg-[#edf2f5] p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#718391]">
                        Request ID
                      </p>
                      <p className="mt-3 text-lg font-black text-[#0b304b]">
                        #{request.id}
                      </p>
                    </div>

                    <div className="bg-[#edf2f5] p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#718391]">
                        Document
                      </p>
                      <p className="mt-3 font-black text-[#0b304b]">
                        {documentType?.name || "Unknown Document"}
                      </p>
                    </div>

                    <div className="bg-[#edf2f5] p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#718391]">
                        Processing Time
                      </p>
                      <p className="mt-3 font-black text-[#0b304b]">
                        {documentType?.processing_days != null
                          ? `${documentType.processing_days} day${
                              documentType.processing_days === 1 ? "" : "s"
                            }`
                          : "Not specified"}
                      </p>
                    </div>

                    <div className="bg-[#f8f0df] p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#9b7b40]">
                        Document Fee
                      </p>
                      <p className="mt-3 font-black text-[#0b304b]">
                        {documentType?.fee != null
                          ? `₱${documentType.fee}`
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 border-t border-[#e3e9ee] pt-7">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#9b7b40]">
                      Purpose of Request
                    </p>

                    <div className="mt-4 bg-[#edf2f5] p-5">
                      <p className="wrap-break-word text-sm leading-7 text-[#697d8c]">
                        {request.purpose || "No purpose provided."}
                      </p>
                    </div>
                  </div>
                </section>

                {/* STATUS TRACKER */}
                <section className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                    Progress
                  </p>

                  <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                    Current Status
                  </h2>

                  <StatusTracker status={request.status} />
                </section>

                {/* QR DOCUMENT CLAIMING */}
                {isCompleted && (
                  <section className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                        <QrCode size={24} />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                          Document Pickup
                        </p>

                        <h2 className="mt-1 text-xl font-black text-[#0b304b]">
                          {isClaimed
                            ? "Document Already Claimed"
                            : "Document Claim QR"}
                        </h2>
                      </div>
                    </div>

                    {isClaimed ? (
                      <div className="mt-7 flex items-start gap-4 border-l-4 border-[#357c60] bg-[#edf7f1] p-5 text-[#245e48]">
                        <CheckCircle2 size={23} className="shrink-0" />

                        <div>
                          <p className="font-black">
                            Your document has been claimed.
                          </p>

                          <p className="mt-2 text-sm leading-7">
                            Claimed on{" "}
                            {new Date(request.claimed_at!).toLocaleString(
                              "en-PH",
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    ) : request.claim_token ? (
                      <>
                        <div className="mt-7 border border-[#dce3e8] bg-[#f8fafb] p-6 text-center">
                          <div className="mx-auto inline-flex max-w-full items-center justify-center bg-white p-5 shadow-sm">
                            <QRCodeSVG
                              value={request.claim_token}
                              size={210}
                              level="H"
                              marginSize={1}
                              bgColor="#ffffff"
                              fgColor="#0b304b"
                              title={`Claim QR for request ${request.id}`}
                            />
                          </div>

                          <p className="mt-6 text-lg font-black text-[#0b304b]">
                            Ready for Pickup
                          </p>

                          <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#697d8c]">
                            Present this QR code to the barangay staff
                            when claiming your document.
                          </p>

                          <p className="mt-4 text-xs font-bold text-[#718391]">
                            Request #{request.id}
                          </p>
                        </div>

                        <div className="mt-5 flex items-start gap-3 border-l-4 border-[#d5bd81] bg-[#f8f0df] p-5">
                          <QrCode
                            size={18}
                            className="mt-0.5 shrink-0 text-[#9b7b40]"
                          />

                          <p className="text-sm leading-7 text-[#6c592f]">
                            Keep your QR code private. Barangay staff
                            must verify your identity and request
                            before releasing the document. A QR scan
                            alone does not authorize release.
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="mt-7 bg-[#f8f0df] p-5">
                        <p className="text-sm leading-7 text-[#8e6b25]">
                          Your document is completed, but its claim
                          QR is not available yet. Please contact
                          the barangay office.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* CANCEL REQUEST */}
                {canCancel && (
                  <section className="border border-[#e7c8bf] bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9473c]">
                          Request Options
                        </p>

                        <h2 className="mt-3 text-xl font-black text-[#0b304b]">
                          Need to cancel this request?
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-[#697d8c]">
                          You can cancel this request while it is
                          still pending. Once barangay processing
                          begins, cancellation is no longer available.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          setSuccessMessage("");
                          setShowCancelModal(true);
                        }}
                        className="inline-flex shrink-0 items-center justify-center gap-2 border border-[#a9473c] px-5 py-3.5 text-sm font-black text-[#a9473c] transition hover:bg-[#a9473c] hover:text-white"
                      >
                        <Ban size={17} />
                        Cancel Request
                      </button>
                    </div>
                  </section>
                )}
              </div>

              {/* STATUS HISTORY */}
              <section className="h-fit border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                  Activity
                </p>

                <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                  Status History
                </h2>

                <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                  Updates and remarks provided for this request.
                </p>

                {history.length === 0 ? (
                  <div className="mt-7 bg-[#edf2f5] p-5">
                    <p className="text-sm text-[#718391]">
                      No status history available.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8">
                    {history.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center ${statusStyle(
                              item.status
                            )}`}
                          >
                            <StatusIcon status={item.status} />
                          </div>

                          {index < history.length - 1 && (
                            <div className="my-2 min-h-10 w-px flex-1 bg-[#d5dfe7]" />
                          )}
                        </div>

                        <div className="min-w-0 pb-7">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-black text-[#0b304b]">
                              {item.status}
                            </p>

                            {index === history.length - 1 && (
                              <span className="bg-[#e8eef3] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#0b304b]">
                                Latest
                              </span>
                            )}
                          </div>

                          <p className="mt-2 wrap-break-word text-sm leading-7 text-[#697d8c]">
                            {item.remarks || "No remarks provided."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </div>
      </footer>

      {/* CANCELLATION CONFIRMATION MODAL */}
      {showCancelModal && request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061b2b]/75 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-request-title"
            className="w-full max-w-md bg-white p-7 shadow-2xl sm:p-9"
          >
            <div className="flex h-12 w-12 items-center justify-center bg-[#fae9e6] text-[#a9473c]">
              <TriangleAlert size={23} />
            </div>

            <h2
              id="cancel-request-title"
              className="mt-6 text-2xl font-black text-[#0b304b]"
            >
              Cancel this request?
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#697d8c]">
              You are about to cancel Request #{request.id}.
              This request will no longer continue through
              barangay processing.
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="border border-[#cdd9e2] px-6 py-3.5 text-sm font-black text-[#0b304b] transition hover:bg-[#edf2f5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Request
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelRequest}
                className="inline-flex items-center justify-center gap-2 bg-[#a9473c] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#8c392f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <Ban size={17} />
                    Yes, Cancel Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}