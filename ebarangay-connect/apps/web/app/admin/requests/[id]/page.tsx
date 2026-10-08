
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

      if (cancelled) return;

      if (sessionError || !session) {
        router.replace("/login");
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

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

      if (cancelled) return;

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

      const requestData = data as RequestDetails;

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

      if (cancelled) return;

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

      if (cancelled) return;

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

    if (!request) return;

    setUpdating(true);
    setUpdateError("");
    setSuccessMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setUpdating(false);
      router.replace("/login");
      return;
    }

    // VERIFY ADMIN ROLE
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

    // PREVENT CHANGES TO CANCELLED REQUESTS
    if (request.status?.toLowerCase() === "cancelled") {
      setUpdateError(
        "Cancelled requests cannot be updated."
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

    // VERIFY STATUS UPDATE
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

    // SAVE STATUS HISTORY
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
    if (!request?.document_types) return null;

    if (Array.isArray(request.document_types)) {
      return request.document_types[0] ?? null;
    }

    return request.document_types;
  }

  function getStatusIcon(status: string) {
    const normalized = status.toLowerCase();

    if (normalized === "completed")
      return <Check size={16} />;

    if (normalized === "rejected")
      return <X size={16} />;

    if (normalized === "cancelled")
      return <Ban size={16} />;

    if (normalized === "processing")
      return <Loader2 size={16} />;

    return <Clock size={16} />;
  }

  function getStatusClass(status: string) {
    const normalized = status.toLowerCase();

    if (normalized === "completed")
      return "bg-[#e6f2eb] text-[#28724e]";

    if (normalized === "rejected")
      return "bg-[#fae9e6] text-[#a9473c]";

    if (normalized === "cancelled")
      return "bg-[#eceff1] text-[#566775]";

    if (normalized === "processing")
      return "bg-[#e5eff9] text-[#255e91]";

    return "bg-[#fbf1d9] text-[#8e6b25]";
  }

  function getTimelineCircleClass(status: string) {
    const normalized = status.toLowerCase();

    if (normalized === "completed")
      return "bg-[#28724e] text-white";

    if (normalized === "rejected")
      return "bg-[#a9473c] text-white";

    if (normalized === "cancelled")
      return "bg-[#566775] text-white";

    if (normalized === "processing")
      return "bg-[#255e91] text-white";

    return "bg-[#b18b43] text-white";
  }

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
            Loading request
          </p>

          <p className="mt-2 text-sm text-[#697d8c]">
            Checking admin access and request details...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-5 py-10 font-sans">
        <div className="w-full max-w-lg border border-[#dce3e8] bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#fae9e6] text-[#a9473c]">
            <XCircle size={28} />
          </div>

          <h1 className="mt-6 text-2xl font-black text-[#0b304b]">
            Unable to Load Request
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#697d8c]">
            {errorMessage}
          </p>

          <Link
            href="/admin"
            className="mt-8 inline-flex items-center gap-2 bg-[#0b304b] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70]"
          >
            <ArrowLeft size={16} />
            Back to Admin Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const documentType = getDocumentType();

  const isCancelled =
    request?.status?.toLowerCase() === "cancelled";

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7d7e3] sm:text-xs">
            Digital Citizen Services Portal
          </span>

          <span className="hidden text-xs text-[#c7d7e3] sm:block">
            Administrator Access
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/admin"
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
            <span className="hidden items-center gap-2 border border-[#d5bd81]/50 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[#e2c991] md:inline-flex">
              <ShieldCheck size={15} />
              Administrator
            </span>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('/barangay-hall.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-[#061b2b]/95 via-[#0b304b]/90 to-[#0b304b]/75" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#d5bd81]" />

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e2c991]">
              Request Management
            </p>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d5bd81]">
                Request #{request?.id}
              </p>

              <h1 className="mt-3 max-w-3xl wrap-wrap-break-word text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                {documentType?.name ?? "Unknown Document"}
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
                Review resident information, manage the
                request status, and view the processing
                history.
              </p>
            </div>

            {request?.status && (
              <span
                className={`inline-flex w-fit shrink-0 items-center gap-2 px-5 py-3 text-sm font-black ${getStatusClass(
                  request.status
                )}`}
              >
                {getStatusIcon(request.status)}
                {request.status}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
        >
          <ArrowLeft size={16} />
          Back to Admin Dashboard
        </Link>

        {/* RESIDENT INFORMATION */}
        <section className="mt-8 border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-[#e3e9ee] pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                Resident Information
              </p>

              <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                Requester Details
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                Account information of the resident who
                submitted this request.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
              <UserRound size={22} />
            </div>
          </div>

          {resident ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Full Name",
                  value: resident.full_name,
                  icon: <UserRound size={19} />,
                },
                {
                  label: "Email Address",
                  value: resident.email,
                  icon: <Mail size={19} />,
                },
                {
                  label: "Phone Number",
                  value: resident.phone_number,
                  icon: <Phone size={19} />,
                },
                {
                  label: "Address",
                  value: resident.address,
                  icon: <MapPin size={19} />,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-[#dce3e8] bg-[#f8fafc] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                    {item.icon}
                  </div>

                  <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8193a2]">
                    {item.label}
                  </p>

                  <p className="mt-2 wrap-wrap-break-word text-base font-black leading-7 text-[#173149]">
                    {item.value || "Not provided"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-7 border border-[#dce3e8] bg-[#f8fafc] p-8 text-center">
              <UserRound
                size={26}
                className="mx-auto text-[#8193a2]"
              />

              <p className="mt-4 font-black text-[#0b304b]">
                Resident profile not found
              </p>

              <p className="mt-2 text-sm text-[#697d8c]">
                No matching profile was found for this
                request.
              </p>
            </div>
          )}
        </section>

        {/* STATUS MANAGEMENT */}
        <section className="mt-7 border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-[#e3e9ee] pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                Admin Controls
              </p>

              <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                Update Request Status
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#697d8c]">
                Select a new status and optionally add
                remarks for the resident.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
              <ShieldCheck size={22} />
            </div>
          </div>

          {successMessage && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 border-l-4 border-[#357c60] bg-[#edf7f1] px-5 py-4"
            >
              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0 text-[#357c60]"
              />

              <p className="text-sm font-bold leading-7 text-[#245e48]">
                {successMessage}
              </p>
            </div>
          )}

          {updateError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-5 py-4"
            >
              <XCircle
                size={20}
                className="mt-0.5 shrink-0 text-[#a9473c]"
              />

              <p className="wrap-wrap-break-word text-sm font-bold leading-7 text-[#943d31]">
                {updateError}
              </p>
            </div>
          )}

          {isCancelled ? (
            <div className="mt-7 border border-[#dce3e8] bg-[#f8fafc] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#eceff1] text-[#566775]">
                  <Ban size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#0b304b]">
                    Request Cancelled
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                    This request was cancelled by the
                    resident. Its processing status can no
                    longer be changed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleStatusUpdate}
              className="mt-7"
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-black text-[#173149]"
                  >
                    New Status
                  </label>

                  <select
                    id="status"
                    value={selectedStatus}
                    disabled={updating}
                    onChange={(event) => {
                      setSelectedStatus(event.target.value);
                      setSuccessMessage("");
                      setUpdateError("");
                    }}
                    className="mt-3 w-full border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm font-bold text-[#173149] outline-none transition focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <p className="mt-3 text-xs leading-6 text-[#718391]">
                    Current status:{" "}
                    <span className="font-black text-[#0b304b]">
                      {request?.status || "Pending"}
                    </span>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="remarks"
                    className="block text-sm font-black text-[#173149]"
                  >
                    Remarks
                  </label>

                  <textarea
                    id="remarks"
                    value={remarks}
                    disabled={updating}
                    onChange={(event) => {
                      setRemarks(event.target.value);
                      setSuccessMessage("");
                      setUpdateError("");
                    }}
                    rows={4}
                    placeholder="Example: Your document is now being processed."
                    className="mt-3 w-full resize-none border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-[#173149] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-5 bg-[#f0f4f7] p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718391]">
                    Selected Status
                  </p>

                  <span
                    className={`mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-black ${getStatusClass(
                      selectedStatus
                    )}`}
                  >
                    {getStatusIcon(selectedStatus)}
                    {selectedStatus}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#0b304b] px-7 py-3 text-sm font-black text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
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
          )}
        </section>

        {/* DOCUMENT DETAILS AND HISTORY */}
        <div className="mt-7 grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          {/* DOCUMENT DETAILS */}
          <section className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
            <div className="border-b border-[#e3e9ee] pb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                Request Information
              </p>

              <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                Document Details
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                Information submitted for this barangay
                document request.
              </p>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Request ID",
                  value: `#${request?.id}`,
                  icon: <FileText size={19} />,
                },
                {
                  label: "Document Type",
                  value:
                    documentType?.name ??
                    "Unknown Document",
                  icon: <FileText size={19} />,
                },
                {
                  label: "Processing Time",
                  value: `${
                    documentType?.processing_days ?? 0
                  } day${
                    documentType?.processing_days === 1
                      ? ""
                      : "s"
                  }`,
                  icon: <Timer size={19} />,
                },
                {
                  label: "Fee",
                  value: `₱${documentType?.fee ?? 0}`,
                  icon: <PhilippinePeso size={19} />,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-[#dce3e8] bg-[#f8fafc] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                    {item.icon}
                  </div>

                  <p className="mt-5 text-xs font-bold uppercase tracking-wide text-[#8193a2]">
                    {item.label}
                  </p>

                  <p className="mt-2 wrap-wrap-break-word text-lg font-black text-[#173149]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <p className="text-sm font-black text-[#173149]">
                Purpose
              </p>

              <div className="mt-3 border border-[#dce3e8] bg-[#f8fafc] p-5">
                <p className="wrap-wrap-break-word text-sm leading-8 text-[#697d8c]">
                  {request?.purpose ||
                    "No purpose provided."}
                </p>
              </div>
            </div>

            <div className="mt-7 bg-[#f0f4f7] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#718391]">
                Current Request Status
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <p className="text-lg font-black text-[#0b304b]">
                  {request?.status || "Pending"}
                </p>

                {request?.status && (
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-black ${getStatusClass(
                      request.status
                    )}`}
                  >
                    {getStatusIcon(request.status)}
                    {request.status}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* STATUS HISTORY */}
          <section className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-start gap-4 border-b border-[#e3e9ee] pb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                <Clock size={20} />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#0b304b]">
                  Status History
                </h2>

                <p className="mt-2 text-sm text-[#697d8c]">
                  Request processing timeline.
                </p>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                  <Clock size={23} />
                </div>

                <p className="mt-5 font-black text-[#0b304b]">
                  No history yet
                </p>

                <p className="mt-2 text-sm leading-7 text-[#697d8c]">
                  No status history is available for this
                  request.
                </p>
              </div>
            ) : (
              <div className="mt-7">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative flex gap-4 pb-8 last:pb-0"
                  >
                    {index < history.length - 1 && (
                      <div className="absolute left-5 top-10 h-[calc(100%-24px)] w-px bg-[#dce3e8]" />
                    )}

                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center ${getTimelineCircleClass(
                        item.status
                      )}`}
                    >
                      {getStatusIcon(item.status)}
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-black text-[#0b304b]">
                          {item.status}
                        </p>

                        <span className="shrink-0 bg-[#f0f4f7] px-2.5 py-1 text-[10px] font-black text-[#718391]">
                          #{item.id}
                        </span>
                      </div>

                      <p className="mt-2 wrap-wrap-break-word text-sm leading-7 text-[#697d8c]">
                        {item.remarks ||
                          "No remarks provided."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-7 border-t border-[#e3e9ee] pt-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#718391]">
                  <CheckCircle2
                    size={15}
                    className="text-[#28724e]"
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

        {/* BACK BUTTON */}
        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-[#0b304b] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70]"
          >
            <ArrowLeft size={16} />
            Back to Admin Dashboard
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Administrator request management portal.</p>
        </div>
      </footer>
    </main>
  );
}
