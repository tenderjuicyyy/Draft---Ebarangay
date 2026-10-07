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
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type DocumentType = {
  name: string;
};

type RequestItem = {
  id: number;
  status: string | null;
  purpose: string | null;
  document_types: DocumentType | DocumentType[] | null;
};

export default function AdminPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [documentFilter, setDocumentFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", session.user.id)
          .maybeSingle();

      if (cancelled) {
        return;
      }

      if (profileError) {
        setErrorMessage(profileError.message);
        setLoading(false);
        return;
      }

      if (!profile) {
        setErrorMessage("Your profile was not found.");
        setLoading(false);
        return;
      }

      if (profile.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("document_requests")
        .select(`
          id,
          status,
          purpose,
          document_types (
            name
          )
        `)
        .order("id", {
          ascending: false,
        });

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setRequests((data as RequestItem[]) || []);
      setLoading(false);
    }

    loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function updateStatus(
    requestId: number,
    newStatus: string
  ) {
    const currentRequest = requests.find(
      (request) => request.id === requestId
    );

    if (
      currentRequest?.status?.toLowerCase() === "cancelled"
    ) {
      setErrorMessage(
        "Cancelled requests cannot be updated."
      );
      setSuccessMessage("");
      return;
    }

    setUpdatingId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      setUpdatingId(null);
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

    if (profileError) {
      setErrorMessage(profileError.message);
      setUpdatingId(null);
      return;
    }

    if (!profile || profile.role !== "admin") {
      router.replace("/dashboard");
      setUpdatingId(null);
      return;
    }

    const { error: updateError } = await supabase
      .from("document_requests")
      .update({
        status: newStatus,
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Status update error:", updateError);

      setErrorMessage(
        `Failed to update request status: ${updateError.message}`
      );

      setUpdatingId(null);
      return;
    }

    const {
      data: updatedRequest,
      error: verifyError,
    } = await supabase
      .from("document_requests")
      .select("id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (verifyError) {
      setErrorMessage(
        `Status was updated, but verification failed: ${verifyError.message}`
      );

      setUpdatingId(null);
      return;
    }

    if (!updatedRequest) {
      setErrorMessage(
        "The request could not be found after updating."
      );

      setUpdatingId(null);
      return;
    }

    if (updatedRequest.status !== newStatus) {
      setErrorMessage(
        "The request status was not saved correctly."
      );

      setUpdatingId(null);
      return;
    }

    let remarks = "Request status changed.";

    if (newStatus === "Pending") {
      remarks = "Request status changed to Pending.";
    } else if (newStatus === "Processing") {
      remarks = "Request is now being processed.";
    } else if (newStatus === "Completed") {
      remarks = "Request has been completed.";
    } else if (newStatus === "Rejected") {
      remarks = "Request has been rejected.";
    }

    const { error: historyError } = await supabase
      .from("request_status_history")
      .insert({
        request_id: requestId,
        status: newStatus,
        remarks: remarks,
      });

    if (historyError) {
      console.error("History error:", historyError);

      setErrorMessage(
        `Status was saved, but history could not be saved: ${historyError.message}`
      );
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: newStatus,
            }
          : request
      )
    );

    setSuccessMessage(
      `Request #${requestId} updated to ${newStatus}.`
    );

    setUpdatingId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

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
    const currentStatus = status?.toLowerCase();

    if (currentStatus === "completed") {
      return "bg-[#dfe9d5] text-[#435332]";
    }

    if (currentStatus === "processing") {
      return "bg-[#e9e3cd] text-[#6b6037]";
    }

    if (currentStatus === "rejected") {
      return "bg-[#f3ddd5] text-[#9a4f3c]";
    }

    if (currentStatus === "cancelled") {
      return "bg-[#e8e3df] text-[#655d58]";
    }

    return "bg-[#f4e7cf] text-[#9a672e]";
  }

  function getStatusIcon(status: string | null) {
    const currentStatus = status?.toLowerCase();

    if (currentStatus === "completed") {
      return <CheckCircle2 size={14} />;
    }

    if (currentStatus === "processing") {
      return <Loader2 size={14} />;
    }

    if (currentStatus === "rejected") {
      return <XCircle size={14} />;
    }

    if (currentStatus === "cancelled") {
      return <Ban size={14} />;
    }

    return <Clock size={14} />;
  }

  const pending = requests.filter(
    (request) =>
      request.status?.toLowerCase() === "pending"
  ).length;

  const processing = requests.filter(
    (request) =>
      request.status?.toLowerCase() === "processing"
  ).length;

  const completed = requests.filter(
    (request) =>
      request.status?.toLowerCase() === "completed"
  ).length;

  const rejected = requests.filter(
    (request) =>
      request.status?.toLowerCase() === "rejected"
  ).length;

  const cancelledCount = requests.filter(
    (request) =>
      request.status?.toLowerCase() === "cancelled"
  ).length;

  const documentTypes = Array.from(
    new Set(
      requests
        .map((request) => getDocumentName(request))
        .filter(
          (name) => name !== "Unknown Document"
        )
    )
  );

  const filteredRequests = requests.filter((request) => {
    const documentName =
      getDocumentName(request).toLowerCase();

    const purpose =
      request.purpose?.toLowerCase() || "";

    const requestId = request.id.toString();

    const search =
      searchTerm.toLowerCase().trim();

    const matchesSearch =
      documentName.includes(search) ||
      purpose.includes(search) ||
      requestId.includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      request.status?.toLowerCase() ===
        statusFilter.toLowerCase();

    const matchesDocument =
      documentFilter === "All" ||
      getDocumentName(request) === documentFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDocument
    );
  });

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
            Loading admin dashboard
          </p>

          <p className="mt-1 text-sm text-[#777465]">
            Checking your admin access...
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

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full bg-[#e4e6d6] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#59613f] sm:inline-flex">
                <ShieldCheck size={14} />
                Administrator
              </span>

              <button
                type="button"
                onClick={logout}
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

        {/* MAIN CONTENT */}
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
                  <LayoutDashboard size={14} />

                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#d7d8c5]">
                    Administration
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                  Admin Dashboard
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d4d5c5] sm:text-base">
                  Review resident document requests, monitor
                  their progress, and manage request statuses
                  from one place.
                </p>
              </div>

              <div className="flex w-fit items-center gap-3 rounded-2xl bg-white/10 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2ecdf] text-[#505738]">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#cfd1bd]">
                    Access
                  </p>

                  <p className="font-black">
                    Administrator
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* MESSAGES */}
          {successMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-3xl border border-[#bdc9ae] bg-[#e5ecdc] p-5">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-[#53663e]"
              />

              <div>
                <p className="font-black text-[#435332]">
                  Status updated
                </p>

                <p className="mt-1 text-sm text-[#5f704d]">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

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

          {/* STATS */}
          <section className="grid grid-cols-2 gap-3 py-6 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <p className="text-3xl font-black text-[#292c21]">
                {requests.length}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Total Requests
              </p>
            </div>

            <div className="rounded-3xl border border-[#e2d5bd] bg-[#f8f0df] p-5">
              <p className="text-3xl font-black text-[#9a672e]">
                {pending}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#8c7757]">
                Pending
              </p>
            </div>

            <div className="rounded-3xl border border-[#ded6b9] bg-[#eee9d6] p-5">
              <p className="text-3xl font-black text-[#6b6037]">
                {processing}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#77705a]">
                Processing
              </p>
            </div>

            <div className="rounded-3xl border border-[#cbd5bf] bg-[#e7ecdf] p-5">
              <p className="text-3xl font-black text-[#435332]">
                {completed}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#657157]">
                Completed
              </p>
            </div>

            <div className="rounded-3xl border border-[#e0c5ba] bg-[#f3e3dc] p-5">
              <p className="text-3xl font-black text-[#9a4f3c]">
                {rejected}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#966556]">
                Rejected
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8d1c8] bg-[#ebe7e1] p-5">
              <p className="text-3xl font-black text-[#625c57]">
                {cancelledCount}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#77706a]">
                Cancelled
              </p>
            </div>
          </section>

          {/* FILTERS */}
          <section className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6e8d8] text-[#5b6442]">
                <SlidersHorizontal size={18} />
              </div>

              <div>
                <p className="font-black text-[#303328]">
                  Find requests
                </p>

                <p className="mt-1 text-sm text-[#777465]">
                  Search and filter resident document
                  requests.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {/* SEARCH */}
              <div>
                <label
                  htmlFor="request-search"
                  className="mb-2 block text-sm font-black text-[#4f5143]"
                >
                  Search Requests
                </label>

                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f8b7c]"
                  />

                  <input
                    id="request-search"
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="ID, document, or purpose..."
                    className="w-full rounded-2xl border border-[#d5cebc] bg-[#fffdf7] py-3.5 pl-11 pr-4 text-sm text-[#34372b] outline-none transition placeholder:text-[#aaa697] focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20"
                  />
                </div>
              </div>

              {/* STATUS FILTER */}
              <div>
                <label
                  htmlFor="status-filter"
                  className="mb-2 block text-sm font-black text-[#4f5143]"
                >
                  Status
                </label>

                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="w-full rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm font-semibold text-[#34372b] outline-none transition focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20"
                >
                  <option value="All">
                    All Requests
                  </option>

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Processing">
                    Processing
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Rejected">
                    Rejected
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              {/* DOCUMENT FILTER */}
              <div>
                <label
                  htmlFor="document-filter"
                  className="mb-2 block text-sm font-black text-[#4f5143]"
                >
                  Document
                </label>

                <div className="relative">
                  <FileText
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8f8b7c]"
                  />

                  <select
                    id="document-filter"
                    value={documentFilter}
                    onChange={(event) =>
                      setDocumentFilter(event.target.value)
                    }
                    className="w-full appearance-none rounded-2xl border border-[#d5cebc] bg-[#fffdf7] py-3.5 pl-11 pr-4 text-sm font-semibold text-[#34372b] outline-none transition focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20"
                  >
                    <option value="All">
                      All Documents
                    </option>

                    {documentTypes.map((documentType) => (
                      <option
                        key={documentType}
                        value={documentType}
                      >
                        {documentType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-[#ded7c6] pt-4">
              <p className="text-sm text-[#777465]">
                Showing{" "}
                <span className="font-black text-[#303328]">
                  {filteredRequests.length}
                </span>{" "}
                of{" "}
                <span className="font-black text-[#303328]">
                  {requests.length}
                </span>{" "}
                requests
              </p>
            </div>
          </section>

          {/* REQUEST LIST */}
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b8058]">
                  Management
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#292c21]">
                  Document Requests
                </h2>
              </div>

              <span className="hidden text-sm font-semibold text-[#858273] sm:block">
                {filteredRequests.length} displayed
              </span>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8e3d5] text-[#616849]">
                  <Search size={24} />
                </div>

                <h3 className="mt-5 text-xl font-black text-[#303328]">
                  No matching requests
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777465]">
                  Try changing your search term or selecting
                  different filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => {
                  const isCancelled =
                    request.status?.toLowerCase() ===
                    "cancelled";

                  return (
                    <article
                      key={request.id}
                      className="overflow-hidden rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea]"
                    >
                      <div className="p-6 sm:p-7">
                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                          <div className="flex gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8e3d5] text-[#616849]">
                              <FileText size={21} />
                            </div>

                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8a8778]">
                                Request #{request.id}
                              </p>

                              <h3 className="mt-1 text-xl font-black text-[#292c21]">
                                {getDocumentName(request)}
                              </h3>

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
                            {getStatusIcon(request.status)}
                            {request.status || "Pending"}
                          </span>
                        </div>

                        {/* STATUS CONTROLS */}
                        <div className="mt-6 border-t border-[#ded7c6] pt-5">
                          {isCancelled ? (
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                              <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8e3df] text-[#655d58]">
                                  <Ban size={18} />
                                </div>

                                <div>
                                  <p className="text-sm font-black text-[#504b47]">
                                    Cancelled by Resident
                                  </p>

                                  <p className="mt-1 max-w-xl text-xs leading-5 text-[#858078]">
                                    This request was cancelled
                                    by the resident while it
                                    was pending. Its processing
                                    status can no longer be
                                    changed.
                                  </p>
                                </div>
                              </div>

                              <Link
                                href={`/admin/requests/${request.id}`}
                                className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#4d5435] px-5 py-3 text-sm font-black text-white transition hover:bg-[#41482d]"
                              >
                                View Details
                                <ArrowRight size={16} />
                              </Link>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                              <div>
                                <p className="text-sm font-black text-[#34372b]">
                                  Update Status
                                </p>

                                <p className="mt-1 text-xs text-[#858273]">
                                  Select the new processing
                                  status for this request.
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStatus(
                                        request.id,
                                        "Pending"
                                      )
                                    }
                                    disabled={
                                      updatingId === request.id
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#e2d5bd] bg-[#f8f0df] px-4 py-2.5 text-sm font-bold text-[#9a672e] transition hover:bg-[#f2e3c6] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Clock size={15} />
                                    Pending
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStatus(
                                        request.id,
                                        "Processing"
                                      )
                                    }
                                    disabled={
                                      updatingId === request.id
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#ded6b9] bg-[#eee9d6] px-4 py-2.5 text-sm font-bold text-[#6b6037] transition hover:bg-[#e5ddc2] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Loader2
                                      size={15}
                                      className={
                                        updatingId ===
                                        request.id
                                          ? "animate-spin"
                                          : ""
                                      }
                                    />
                                    Processing
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStatus(
                                        request.id,
                                        "Completed"
                                      )
                                    }
                                    disabled={
                                      updatingId === request.id
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#cbd5bf] bg-[#e7ecdf] px-4 py-2.5 text-sm font-bold text-[#435332] transition hover:bg-[#dce5d2] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Check size={15} />
                                    Completed
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateStatus(
                                        request.id,
                                        "Rejected"
                                      )
                                    }
                                    disabled={
                                      updatingId === request.id
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#e0c5ba] bg-[#f3e3dc] px-4 py-2.5 text-sm font-bold text-[#9a4f3c] transition hover:bg-[#ecd5cb] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <X size={15} />
                                    Rejected
                                  </button>
                                </div>

                                {updatingId === request.id && (
                                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#777465]">
                                    <Loader2
                                      size={13}
                                      className="animate-spin"
                                    />
                                    Updating request status...
                                  </div>
                                )}
                              </div>

                              <Link
                                href={`/admin/requests/${request.id}`}
                                className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#4d5435] px-5 py-3 text-sm font-black text-white transition hover:bg-[#41482d]"
                              >
                                View Details
                                <ArrowRight size={16} />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 border-t border-[#d9d2c1] bg-[#f7f3e9] px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 text-xs text-[#858273] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 eBarangay Connect</p>
            <p>Administrator request management portal.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}