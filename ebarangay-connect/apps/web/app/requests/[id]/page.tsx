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
  Home,
  Loader2,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
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
  document_types: DocumentType | DocumentType[] | null;
};

type HistoryItem = {
  id: number;
  request_id: number;
  status: string;
  remarks: string | null;
};

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

      if (!id || Number.isNaN(id)) {
        setNotFound(true);
        setLoading(false);
        return;
      }

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
        .eq("profile_id", userId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

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

      setRequest(data as RequestItem);

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

      if (cancelled) {
        return;
      }

      if (historyError) {
        console.error("HISTORY ERROR:", historyError);
        setErrorMessage(
          `HISTORY ERROR: ${historyError.message}`
        );
        setHistory([]);
        setLoading(false);
        return;
      }

      setHistory((historyData as HistoryItem[]) || []);
      setLoading(false);
    }

    loadRequest();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function handleCancelRequest() {
    if (!request) {
      return;
    }

    if (request.status?.toLowerCase() !== "pending") {
      setErrorMessage(
        "Only pending requests can be cancelled."
      );
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

    // Cancel only this resident's own Pending request.
    const { error: updateError } = await supabase
      .from("document_requests")
      .update({
        status: "Cancelled",
      })
      .eq("id", request.id)
      .eq("profile_id", userId)
      .eq("status", "Pending");

    if (updateError) {
      console.error("CANCEL ERROR:", updateError);
      setErrorMessage(
        `CANCEL ERROR: ${updateError.message}`
      );
      setCancelling(false);
      return;
    }

    // Verify that the request really became Cancelled.
    const { data: updatedRequest, error: verifyError } =
      await supabase
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
        .eq("id", request.id)
        .eq("profile_id", userId)
        .maybeSingle();

    if (verifyError) {
      console.error("VERIFY ERROR:", verifyError);
      setErrorMessage(
        `VERIFY ERROR: ${verifyError.message}`
      );
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

    // Add cancellation to status history.
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

    if (historyError) {
      console.error(
        "CANCELLATION HISTORY ERROR:",
        historyError
      );

      // The request is already cancelled, so reflect that
      // correctly even if the history insert failed.
      setRequest(updatedRequest as RequestItem);
      setShowCancelModal(false);
      setCancelling(false);

      setErrorMessage(
        `The request was cancelled, but the cancellation history could not be saved: ${historyError.message}`
      );

      return;
    }

    setRequest(updatedRequest as RequestItem);

    if (newHistory) {
      setHistory((currentHistory) => [
        ...currentHistory,
        newHistory as HistoryItem,
      ]);
    }

    setSuccessMessage(
      "Your request has been cancelled successfully."
    );

    setShowCancelModal(false);
    setCancelling(false);
  }

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
        return "bg-[#dfe9d5] text-[#435332]";

      case "processing":
        return "bg-[#e9e3cd] text-[#6b6037]";

      case "rejected":
        return "bg-[#f3ddd5] text-[#9a4f3c]";

      case "cancelled":
        return "bg-[#e8e3df] text-[#655d58]";

      case "pending":
      default:
        return "bg-[#f4e7cf] text-[#9a672e]";
    }
  }

  function getStatusIcon(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle2 size={16} />;

      case "processing":
        return <Loader2 size={16} />;

      case "rejected":
        return <XCircle size={16} />;

      case "cancelled":
        return <Ban size={16} />;

      case "pending":
      default:
        return <Clock size={16} />;
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

      case "cancelled":
        return <Ban size={16} />;

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

      case "cancelled":
        return "bg-[#e8e3df] text-[#655d58]";

      case "pending":
      default:
        return "bg-[#f4e7cf] text-[#9a672e]";
    }
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
                barangay. Review the status history below
                for any remarks provided.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStatus === "cancelled") {
      return (
        <div className="mt-6 rounded-2xl border border-[#d4cec5] bg-[#efebe5] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ddd7d0] text-[#625c57]">
              <Ban size={18} />
            </div>

            <div>
              <p className="font-black text-[#504b47]">
                Request Cancelled
              </p>

              <p className="mt-1 text-sm leading-6 text-[#746e68]">
                You cancelled this request. It will no
                longer continue through barangay
                processing.
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
            Request Progress
          </p>

          <span className="text-xs font-semibold text-[#858273]">
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
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
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

  const documentType = getDocumentType();
  const canCancel =
    request?.status?.toLowerCase() === "pending";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f0e4] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4d5435] text-white">
            <Loader2
              size={27}
              className="animate-spin"
            />
          </div>

          <p className="mt-5 text-lg font-black text-[#25281e]">
            Loading request details
          </p>

          <p className="mt-1 text-sm text-[#777465]">
            Getting your document request information.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#77794f] px-3 py-3 text-[#25281e] sm:px-5 sm:py-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-6xl overflow-hidden rounded-4xl bg-[#f4f0e4] shadow-2xl sm:min-h-[calc(100vh-40px)]">
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
              href="/requests"
              className="inline-flex items-center gap-2 rounded-full border border-[#d3ccba] px-4 py-2.5 text-sm font-bold text-[#555548] transition hover:bg-[#ebe5d7] sm:px-5"
            >
              <ArrowLeft size={16} />

              <span className="hidden sm:inline">
                My Requests
              </span>

              <span className="sm:hidden">
                Back
              </span>
            </Link>
          </div>
        </header>

        <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#696958] transition hover:text-[#b55f3b]"
          >
            <ArrowLeft size={16} />
            Back to My Requests
          </Link>

          {/* ERROR */}
          {errorMessage && (
            <div className="mt-6 rounded-3xl border border-[#dfb9aa] bg-[#f7e5de] p-5">
              <p className="font-black text-[#8d4938]">
                Something went wrong
              </p>

              <p className="mt-1 wrap-break-word text-sm leading-6 text-[#9b5a49]">
                {errorMessage}
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {successMessage && (
            <div className="mt-6 rounded-3xl border border-[#bdc8ae] bg-[#e5ecdc] p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-[#52623f]"
                />

                <div>
                  <p className="font-black text-[#435332]">
                    Request updated
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#617052]">
                    {successMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* NOT FOUND / NOT OWNED */}
          {notFound || !request ? (
            <section className="mt-6 rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                <FileText size={25} />
              </div>

              <h1 className="mt-5 text-2xl font-black text-[#292c21]">
                Request not found
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777465]">
                This request does not exist or it does not
                belong to your account.
              </p>

              <Link
                href="/requests"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#4d5435] px-6 py-3 text-sm font-black text-white transition hover:bg-[#41482d]"
              >
                <ArrowLeft size={16} />
                Return to My Requests
              </Link>
            </section>
          ) : (
            <>
              {/* HERO */}
              <section className="mt-6 overflow-hidden rounded-4xl bg-[#4d5435] text-[#f7f2e7]">
                <div className="p-7 sm:p-9 lg:p-10">
                  <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                        <FileText size={14} />

                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#d7d8c5]">
                          Request #{request.id}
                        </span>
                      </div>

                      <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                        {documentType?.name ||
                          "Unknown Document"}
                      </h1>

                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d4d5c5] sm:text-base">
                        Review your request information,
                        current processing status, and
                        barangay updates.
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${getStatusStyle(
                        request.status
                      )}`}
                    >
                      {getStatusIcon(request.status)}
                      {request.status || "Pending"}
                    </span>
                  </div>
                </div>
              </section>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                {/* LEFT */}
                <div className="space-y-6">
                  {/* REQUEST INFO */}
                  <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b8058]">
                      Request Information
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-[#303328]">
                      Document Details
                    </h2>

                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-[#f1ecdf] p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#898576]">
                          Request ID
                        </p>

                        <p className="mt-2 text-lg font-black text-[#303328]">
                          #{request.id}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f1ecdf] p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#898576]">
                          Document
                        </p>

                        <p className="mt-2 font-black text-[#303328]">
                          {documentType?.name ||
                            "Unknown Document"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f1ecdf] p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#898576]">
                          Processing Time
                        </p>

                        <p className="mt-2 font-black text-[#303328]">
                          {documentType?.processing_days !==
                            null &&
                          documentType?.processing_days !==
                            undefined
                            ? `${documentType.processing_days} day${
                                documentType.processing_days ===
                                1
                                  ? ""
                                  : "s"
                              }`
                            : "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#f1ecdf] p-5">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#898576]">
                          Fee
                        </p>

                        <p className="mt-2 font-black text-[#303328]">
                          {documentType?.fee !== null &&
                          documentType?.fee !== undefined
                            ? `₱${documentType.fee}`
                            : "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[#ded7c6] pt-6">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#898576]">
                        Purpose
                      </p>

                      <div className="mt-3 rounded-2xl bg-[#f1ecdf] p-5">
                        <p className="wrap-break-word text-sm leading-6 text-[#626256]">
                          {request.purpose ||
                            "No purpose provided."}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* STATUS TRACKER */}
                  <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b8058]">
                      Progress
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-[#303328]">
                      Current Status
                    </h2>

                    {renderStatusTracker(request.status)}
                  </section>

                  {/* CANCEL REQUEST */}
                  {canCancel && (
                    <section className="rounded-4xl border border-[#dfc3b7] bg-[#f8f4ea] p-6 sm:p-8">
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a45d43]">
                            Request Options
                          </p>

                          <h2 className="mt-1 text-xl font-black text-[#303328]">
                            Need to cancel this request?
                          </h2>

                          <p className="mt-2 max-w-xl text-sm leading-6 text-[#777465]">
                            You can cancel this request while
                            it is still pending. Once barangay
                            processing begins, cancellation is
                            no longer available.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage("");
                            setSuccessMessage("");
                            setShowCancelModal(true);
                          }}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#c96f46] px-5 py-3 text-sm font-black text-[#a65335] transition hover:bg-[#c96f46] hover:text-white"
                        >
                          <Ban size={17} />
                          Cancel Request
                        </button>
                      </div>
                    </section>
                  )}
                </div>

                {/* RIGHT - HISTORY */}
                <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b8058]">
                    Activity
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#303328]">
                    Status History
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#777465]">
                    Updates and remarks provided for this
                    request.
                  </p>

                  {history.length === 0 ? (
                    <div className="mt-6 rounded-2xl bg-[#f1ecdf] p-5">
                      <p className="text-sm text-[#777465]">
                        No status history available.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-7">
                      {history.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getHistoryIconStyle(
                                item.status
                              )}`}
                            >
                              {getHistoryIcon(item.status)}
                            </div>

                            {index <
                              history.length - 1 && (
                              <div className="my-2 min-h-10 w-px flex-1 bg-[#d7d0bf]" />
                            )}
                          </div>

                          <div className="pb-7">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-black text-[#303328]">
                                {item.status}
                              </p>

                              {index ===
                                history.length - 1 && (
                                <span className="rounded-full bg-[#e3e6d6] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#5b6442]">
                                  Latest
                                </span>
                              )}
                            </div>

                            <p className="mt-2 wrap-break-word text-sm leading-6 text-[#706f62]">
                              {item.remarks ||
                                "No remarks provided."}
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
        <footer className="border-t border-[#d9d2c1] bg-[#f7f3e9] px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 text-xs text-[#858273] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 eBarangay Connect</p>

            <p>
              Digital barangay services for residents.
            </p>
          </div>
        </footer>
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#f8f4ea] p-6 shadow-2xl sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3ddd5] text-[#9a4f3c]">
              <TriangleAlert size={22} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-[#303328]">
              Cancel this request?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#706f62]">
              You are about to cancel Request #{request.id}.
              This request will no longer continue through
              barangay processing.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="rounded-xl border border-[#d3ccba] px-5 py-3 text-sm font-black text-[#555548] transition hover:bg-[#ebe5d7] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Request
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelRequest}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#b85f42] px-5 py-3 text-sm font-black text-white transition hover:bg-[#a65338] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
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