"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  PhilippinePeso,
  Phone,
  Save,
  ShieldCheck,
  Timer,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type DocumentType = {
  name: string;
  processing_days: number;
  fee: number;
};

type RequestDetails = {
  id: number;
  profile_id: string;
  status: string | null;
  purpose: string | null;
  document_type_id: number;
  document_types: DocumentType | DocumentType[] | null;
};

type StatusHistory = {
  id: number;
  status: string;
  remarks: string | null;
};

type ResidentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  role: string | null;
};

const STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Completed",
  "Rejected",
];

export default function AdminRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const requestId = Number(params.id);

  const [request, setRequest] =
    useState<RequestDetails | null>(null);

  const [resident, setResident] =
    useState<ResidentProfile | null>(null);

  const [history, setHistory] =
    useState<StatusHistory[]>([]);

  const [selectedStatus, setSelectedStatus] =
    useState("Pending");

  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRequest() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (sessionError || !session) {
        router.replace("/login");
        return;
      }

      // CHECK ADMIN ROLE
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (profileError) {
        console.error(
          "Profile check error:",
          profileError
        );

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

      // LOAD REQUEST
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
        console.error(
          "Request loading error:",
          error
        );

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

      const requestData =
        data as RequestDetails;

      setRequest(requestData);

      setSelectedStatus(
        requestData.status || "Pending"
      );

      // LOAD RESIDENT
      const {
        data: residentData,
        error: residentError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone_number, address, role"
        )
        .eq("id", requestData.profile_id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (residentError) {
        console.error(
          "Resident loading error:",
          residentError
        );

        setErrorMessage(
          "Request loaded, but the resident information could not be loaded."
        );

        setLoading(false);
        return;
      }

      setResident(
        (residentData as ResidentProfile | null) ??
          null
      );

      // LOAD STATUS HISTORY
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

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleStatusUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!request) {
      return;
    }

    setUpdating(true);
    setUpdateError("");
    setSuccessMessage("");

    // VERIFY CURRENT USER
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setUpdating(false);
      router.replace("/login");
      return;
    }

    // VERIFY ADMIN ROLE AGAIN
    const {
      data: adminProfile,
      error: adminError,
    } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (adminError) {
      console.error(
        "Admin verification error:",
        adminError
      );

      setUpdateError(
        "Unable to verify your admin account."
      );

      setUpdating(false);
      return;
    }

    if (!adminProfile || adminProfile.role !== "admin") {
      setUpdateError(
        "You do not have permission to update requests."
      );

      setUpdating(false);
      return;
    }

    // UPDATE REQUEST STATUS
    const { error: statusError } = await supabase
      .from("document_requests")
      .update({
        status: selectedStatus,
      })
      .eq("id", request.id);

    if (statusError) {
      console.error(
        "Status update error:",
        statusError
      );

      setUpdateError(
        `Failed to update request: ${statusError.message}`
      );

      setUpdating(false);
      return;
    }

    // VERIFY STATUS WAS ACTUALLY UPDATED
    const {
      data: verifiedRequest,
      error: verifyError,
    } = await supabase
      .from("document_requests")
      .select("id, status")
      .eq("id", request.id)
      .maybeSingle();

    if (verifyError) {
      console.error(
        "Status verification error:",
        verifyError
      );

      setUpdateError(
        "The request may have been updated, but the new status could not be verified."
      );

      setUpdating(false);
      return;
    }

    if (
      !verifiedRequest ||
      verifiedRequest.status !== selectedStatus
    ) {
      setUpdateError(
        "The request status did not save correctly. Please try again."
      );

      setUpdating(false);
      return;
    }

    // ADD STATUS HISTORY
    const {
      data: newHistory,
      error: historyError,
    } = await supabase
      .from("request_status_history")
      .insert({
        request_id: request.id,
        status: selectedStatus,
        remarks: remarks.trim() || null,
      })
      .select("id, status, remarks")
      .maybeSingle();

    if (historyError) {
      console.error(
        "History insert error:",
        historyError
      );

      // Status was already updated, so show a specific
      // message instead of pretending the whole operation failed.
      setRequest((currentRequest) =>
        currentRequest
          ? {
              ...currentRequest,
              status: selectedStatus,
            }
          : currentRequest
      );

      setUpdateError(
        `Status changed to ${selectedStatus}, but the status history could not be saved: ${historyError.message}`
      );

      setUpdating(false);
      return;
    }

    // UPDATE UI IMMEDIATELY
    setRequest((currentRequest) =>
      currentRequest
        ? {
            ...currentRequest,
            status: selectedStatus,
          }
        : currentRequest
    );

    if (newHistory) {
      setHistory((currentHistory) => [
        ...currentHistory,
        newHistory as StatusHistory,
      ]);
    } else {
      // Fallback: reload history if INSERT succeeded
      // but Supabase did not return the inserted row.
      const { data: refreshedHistory } =
        await supabase
          .from("request_status_history")
          .select("id, status, remarks")
          .eq("request_id", request.id)
          .order("id", { ascending: true });

      setHistory(refreshedHistory ?? []);
    }

    setRemarks("");

    setSuccessMessage(
      `Request #${request.id} is now ${selectedStatus}.`
    );

    setUpdating(false);
  }

  function getDocumentType() {
    if (!request?.document_types) {
      return null;
    }

    if (Array.isArray(request.document_types)) {
      return request.document_types[0] ?? null;
    }

    return request.document_types;
  }

  function getStatusIcon(status: string) {
    const normalizedStatus =
      status.toLowerCase();

    if (normalizedStatus === "completed") {
      return <Check size={17} />;
    }

    if (normalizedStatus === "rejected") {
      return <X size={17} />;
    }

    if (normalizedStatus === "processing") {
      return <Loader2 size={17} />;
    }

    return <Clock size={17} />;
  }

  function getStatusClass(status: string) {
    const normalizedStatus =
      status.toLowerCase();

    if (normalizedStatus === "completed") {
      return "bg-[#dfe9d5] text-[#435332]";
    }

    if (normalizedStatus === "rejected") {
      return "bg-[#f3ddd5] text-[#9a4f3c]";
    }

    if (normalizedStatus === "processing") {
      return "bg-[#e9e3cd] text-[#6b6037]";
    }

    return "bg-[#f4e7cf] text-[#9a672e]";
  }

  function getTimelineCircleClass(
    status: string
  ) {
    const normalizedStatus =
      status.toLowerCase();

    if (normalizedStatus === "completed") {
      return "bg-[#596847] text-white";
    }

    if (normalizedStatus === "rejected") {
      return "bg-[#b35f48] text-white";
    }

    if (normalizedStatus === "processing") {
      return "bg-[#82764b] text-white";
    }

    return "bg-[#c28a45] text-white";
  }

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
            Loading request
          </p>

          <p className="mt-1 text-sm text-[#777465]">
            Checking admin access and request
            details...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#77794f] px-4 py-6">
        <div className="w-full max-w-lg rounded-4xl bg-[#f4f0e4] p-7 text-center shadow-2xl sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3ddd5] text-[#9a4f3c]">
            <XCircle size={27} />
          </div>

          <h1 className="mt-5 text-2xl font-black text-[#292c21]">
            Unable to Load Request
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#777465]">
            {errorMessage}
          </p>

          <Link
            href="/admin"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#4d5435] px-5 py-3 text-sm font-black text-white transition hover:bg-[#41482d]"
          >
            <ArrowLeft size={16} />
            Back to Admin Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const documentType = getDocumentType();

  return (
    <main className="min-h-screen bg-[#77794f] px-3 py-3 text-[#25281e] sm:px-5 sm:py-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-4xl bg-[#f4f0e4] shadow-2xl sm:min-h-[calc(100vh-40px)]">
        {/* HEADER */}
        <header className="border-b border-[#dcd5c4] bg-[#f7f3e9]">
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
            <Link
              href="/admin"
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

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full bg-[#e4e6d6] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#59613f] sm:inline-flex">
                <ShieldCheck size={14} />
                Administrator
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-[#d6cbbb] px-4 py-2.5 text-sm font-bold text-[#665c50] transition hover:border-[#d7b2a2] hover:bg-[#f1ded7] hover:text-[#9a4f3c]"
              >
                <LogOut size={16} />

                <span className="hidden sm:inline">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#696958] transition hover:text-[#b55f3b]"
          >
            <ArrowLeft size={16} />
            Back to Admin Dashboard
          </Link>

          {/* HERO */}
          <section className="mt-6 overflow-hidden rounded-4xl bg-[#4d5435] text-[#f7f2e7]">
            <div className="p-7 sm:p-9 lg:p-10">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                    <FileText size={14} />

                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#d7d8c5]">
                      Request #{request?.id}
                    </span>
                  </div>

                  <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                    {documentType?.name ??
                      "Unknown Document"}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d4d5c5] sm:text-base">
                    Review the resident, document
                    request information, update its
                    status, and view the complete
                    processing history.
                  </p>
                </div>

                {request?.status && (
                  <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${getStatusClass(
                      request.status
                    )}`}
                  >
                    {getStatusIcon(
                      request.status
                    )}
                    {request.status}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* RESIDENT INFORMATION */}
          <section className="mt-6 rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-[#ded7c6] pb-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                  Resident Information
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#292c21]">
                  Requester details
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#777465]">
                  Account information of the resident
                  who submitted this document request.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6e8d8] text-[#5b6442]">
                <UserRound size={21} />
              </div>
            </div>

            {resident ? (
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <UserRound size={18} />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Full Name
                  </p>

                  <p className="mt-1 wrap-break-word text-base font-black text-[#303328]">
                    {resident.full_name ||
                      "Not provided"}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <Mail size={18} />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Email Address
                  </p>

                  <p className="mt-1 wrap-break-word text-base font-black text-[#303328]">
                    {resident.email ||
                      "Not provided"}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <Phone size={18} />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Phone Number
                  </p>

                  <p className="mt-1 wrap-break-word text-base font-black text-[#303328]">
                    {resident.phone_number ||
                      "Not provided"}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <MapPin size={18} />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Address
                  </p>

                  <p className="mt-1 wrap-break-word text-base font-black leading-6 text-[#303328]">
                    {resident.address ||
                      "Not provided"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-7 rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-6 text-center">
                <UserRound
                  size={25}
                  className="mx-auto text-[#7b8058]"
                />

                <p className="mt-3 font-black text-[#303328]">
                  Resident profile not found
                </p>

                <p className="mt-1 text-sm text-[#777465]">
                  No matching profile was found for
                  this request.
                </p>
              </div>
            )}
          </section>

          {/* ADMIN STATUS MANAGEMENT */}
          <section className="mt-6 rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-[#ded7c6] pb-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c96f46]">
                  Admin Controls
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#292c21]">
                  Update request status
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777465]">
                  Select the new request status and
                  optionally leave a remark for the
                  resident.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e6e8d8] text-[#5b6442]">
                <ShieldCheck size={21} />
              </div>
            </div>

            {successMessage && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#bdc9ae] bg-[#e5ecdc] p-4">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-[#53663e]"
                />

                <p className="text-sm font-bold text-[#435332]">
                  {successMessage}
                </p>
              </div>
            )}

            {updateError && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#e2c3b8] bg-[#f3ddd5] p-4">
                <XCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-[#9a4f3c]"
                />

                <p className="text-sm font-bold text-[#8d4938]">
                  {updateError}
                </p>
              </div>
            )}

            <form
              onSubmit={handleStatusUpdate}
              className="mt-6"
            >
              <div className="grid gap-5 lg:grid-cols-2">
                {/* STATUS */}
                <div>
                  <label
                    htmlFor="status"
                    className="text-sm font-black text-[#34372b]"
                  >
                    New Status
                  </label>

                  <select
                    id="status"
                    value={selectedStatus}
                    disabled={updating}
                    onChange={(event) => {
                      setSelectedStatus(
                        event.target.value
                      );

                      setSuccessMessage("");
                      setUpdateError("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm font-bold text-[#34372b] outline-none transition focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-[#858273]">
                    Current status:{" "}
                    <span className="font-black text-[#55594a]">
                      {request?.status ||
                        "Pending"}
                    </span>
                  </p>
                </div>

                {/* REMARKS */}
                <div>
                  <label
                    htmlFor="remarks"
                    className="text-sm font-black text-[#34372b]"
                  >
                    Remarks
                  </label>

                  <textarea
                    id="remarks"
                    value={remarks}
                    disabled={updating}
                    onChange={(event) => {
                      setRemarks(
                        event.target.value
                      );

                      setSuccessMessage("");
                      setUpdateError("");
                    }}
                    rows={4}
                    placeholder="Example: Your document is now being processed."
                    className="mt-2 w-full resize-none rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm leading-6 text-[#34372b] outline-none transition placeholder:text-[#aaa697] focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-4 rounded-3xl bg-[#ebe6d8] p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#777465]">
                    Selected Status
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${getStatusClass(
                        selectedStatus
                      )}`}
                    >
                      {getStatusIcon(
                        selectedStatus
                      )}

                      {selectedStatus}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c96f46] px-6 py-3 text-sm font-black text-white transition hover:bg-[#b8613d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* DETAILS + HISTORY */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            {/* REQUEST DETAILS */}
            <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
              <div className="border-b border-[#ded7c6] pb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                  Request Information
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#292c21]">
                  Document details
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#777465]">
                  Information submitted for this
                  barangay document request.
                </p>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <FileText size={18} />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Request ID
                  </p>

                  <p className="mt-1 text-lg font-black text-[#303328]">
                    #{request?.id}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <FileText size={18} />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Document Type
                  </p>

                  <p className="mt-1 wrap-break-word text-lg font-black text-[#303328]">
                    {documentType?.name ??
                      "Unknown Document"}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <Timer size={18} />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Processing Time
                  </p>

                  <p className="mt-1 text-lg font-black text-[#303328]">
                    {documentType?.processing_days ??
                      0}{" "}
                    day
                    {documentType?.processing_days ===
                    1
                      ? ""
                      : "s"}
                  </p>
                </div>

                <div className="rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                    <PhilippinePeso
                      size={18}
                    />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#8a8778]">
                    Fee
                  </p>

                  <p className="mt-1 text-lg font-black text-[#303328]">
                    ₱{documentType?.fee ?? 0}
                  </p>
                </div>
              </div>

              {/* PURPOSE */}
              <div className="mt-6">
                <p className="text-sm font-black text-[#34372b]">
                  Purpose
                </p>

                <div className="mt-3 rounded-3xl border border-[#ded7c6] bg-[#fffdf7] p-5">
                  <p className="wrap-break-word text-sm leading-7 text-[#666658]">
                    {request?.purpose ||
                      "No purpose provided."}
                  </p>
                </div>
              </div>

              {/* CURRENT STATUS */}
              <div className="mt-6 rounded-3xl bg-[#ebe6d8] p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#777465]">
                      Current Request Status
                    </p>

                    <p className="mt-1 text-lg font-black text-[#303328]">
                      {request?.status ||
                        "Pending"}
                    </p>
                  </div>

                  {request?.status && (
                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {getStatusIcon(
                        request.status
                      )}

                      {request.status}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* STATUS HISTORY */}
            <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-7">
              <div className="flex items-start gap-3 border-b border-[#ded7c6] pb-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6e8d8] text-[#5b6442]">
                  <Clock size={18} />
                </div>

                <div>
                  <p className="font-black text-[#303328]">
                    Status History
                  </p>

                  <p className="mt-1 text-sm text-[#777465]">
                    Request processing timeline.
                  </p>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ebe6d8] text-[#6a704e]">
                    <Clock size={22} />
                  </div>

                  <p className="mt-4 font-black text-[#4d5042]">
                    No history yet
                  </p>

                  <p className="mt-1 text-sm text-[#858273]">
                    No status history is
                    available for this request.
                  </p>
                </div>
              ) : (
                <div className="mt-6">
                  {history.map(
                    (item, index) => (
                      <div
                        key={item.id}
                        className="relative flex gap-4 pb-7 last:pb-0"
                      >
                        {index <
                          history.length - 1 && (
                          <div className="absolute left-5 top-10 h-[calc(100%-24px)] w-px bg-[#d7d0bf]" />
                        )}

                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getTimelineCircleClass(
                            item.status
                          )}`}
                        >
                          {getStatusIcon(
                            item.status
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pt-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-black text-[#3d4033]">
                              {item.status}
                            </p>

                            <span className="shrink-0 rounded-full bg-[#ece7da] px-2.5 py-1 text-[10px] font-black text-[#858273]">
                              #{item.id}
                            </span>
                          </div>

                          <p className="mt-1 wrap-break-word text-sm leading-6 text-[#777465]">
                            {item.remarks ||
                              "No remarks provided."}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {history.length > 0 && (
                <div className="mt-7 border-t border-[#ded7c6] pt-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#858273]">
                    <CheckCircle2
                      size={14}
                      className="text-[#657157]"
                    />

                    {history.length} status{" "}
                    {history.length === 1
                      ? "update"
                      : "updates"}{" "}
                    recorded
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* BOTTOM ACTION */}
          <div className="mt-6 flex justify-start">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4d5435] px-5 py-3 text-sm font-black text-white transition hover:bg-[#41482d]"
            >
              <ArrowLeft size={16} />
              Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-[#d9d2c1] bg-[#f7f3e9] px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 text-xs text-[#858273] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 eBarangay Connect</p>

            <p>
              Administrator request management
              portal.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}