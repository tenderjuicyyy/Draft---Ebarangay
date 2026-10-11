
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSwitcher from "@/components/DashboardSwitcher";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Landmark,
  Loader2,
  LogOut,
  QrCode,
  Search,
  ShieldCheck,
  SlidersHorizontal,
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
  claimed_at?: string | null;
};

const STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Completed",
  "Rejected",
] as const;

function documentName(request: RequestItem): string {
  const value = request.document_types;

  if (Array.isArray(value)) {
    return value[0]?.name || "Unknown Document";
  }

  return value?.name || "Unknown Document";
}

function displayStatus(request: RequestItem): string {
  if (request.claimed_at) {
    return "Claimed";
  }

  switch (request.status?.toLowerCase()) {
    case "completed":
      return "Ready for Claiming";
    case "approved":
      return "Approved";
    case "ready for claiming":
      return "Ready for Claiming";
    case "processing":
      return "Processing";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "claimed":
      return "Claimed";
    default:
      return "Pending";
  }
}

function statusStyle(status: string): string {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-800";
    case "Processing":
      return "bg-blue-100 text-blue-800";
    case "Approved":
      return "bg-teal-100 text-teal-800";
    case "Ready for Claiming":
      return "bg-green-100 text-green-800";
    case "Claimed":
      return "bg-emerald-100 text-emerald-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-200 text-gray-700";
  }
}

function StatCard({
  title,
  count,
  icon: Icon,
}: {
  title: string;
  count: number;
  icon: typeof Clock;
}) {
  return (
    <div className="border border-[#dce3e8] bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
        <Icon size={21} />
      </div>

      <p className="mt-5 text-3xl font-black text-[#0b304b]">
        {count}
      </p>

      <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#697d8c]">
        {title}
      </p>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(
    null
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [documentFilter, setDocumentFilter] = useState("All");

  // LOAD ADMIN DATA
  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (cancelled) return;

        if (profileError) {
          throw new Error(profileError.message);
        }

        if (profile?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        const { data, error } = await supabase
          .from("document_requests")
          .select(`
            id,
            status,
            purpose,
            claimed_at,
            document_types (
              name
            )
          `)
          .order("id", { ascending: false });

        if (cancelled) return;

        if (error) {
          throw new Error(error.message);
        }

        setRequests((data as RequestItem[]) || []);
      } catch (error) {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load administrator data."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAdminData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // UPDATE STATUS
  async function updateStatus(
    requestId: number,
    newStatus: string
  ) {
    if (updatingId !== null) return;

    const currentRequest = requests.find(
      (request) => request.id === requestId
    );

    if (!currentRequest) return;

    setErrorMessage("");
    setSuccessMessage("");

    const currentStatus = displayStatus(currentRequest);

    if (
      currentStatus === "Cancelled" ||
      currentStatus === "Claimed"
    ) {
      setErrorMessage(
        "Cancelled or claimed requests cannot be updated."
      );
      return;
    }

    if (currentRequest.status === newStatus) {
      setSuccessMessage(
        `Request #${requestId} already has this status.`
      );
      return;
    }

    setUpdatingId(requestId);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: admin, error: adminError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (adminError || admin?.role !== "admin") {
        throw new Error(
          "You are not authorized to update requests."
        );
      }

      // Recheck the latest database state before updating.
      const { data: latest, error: latestError } =
        await supabase
          .from("document_requests")
          .select("id, status, claimed_at")
          .eq("id", requestId)
          .maybeSingle();

      if (latestError) {
        throw new Error(latestError.message);
      }

      if (!latest) {
        throw new Error("Request no longer exists.");
      }

      if (
        latest.claimed_at ||
        ["cancelled", "claimed"].includes(
          (latest.status || "").toLowerCase()
        )
      ) {
        throw new Error(
          "This request has already been claimed or cancelled."
        );
      }

      if (latest.status !== currentRequest.status) {
        throw new Error(
          "The request status changed. Refresh the page before updating."
        );
      }

      const { data: updated, error: updateError } =
        await supabase
          .from("document_requests")
          .update({ status: newStatus })
          .eq("id", requestId)
          .eq("status", latest.status)
          .is("claimed_at", null)
          .select("id, status")
          .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updated) {
        throw new Error(
          "The request could not be updated. Its status may have changed."
        );
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );

      const remarks: Record<string, string> = {
        Pending: "Request marked as pending.",
        Processing: "Request is now being processed.",
        Completed:
          "Document processing completed. Ready for claiming, subject to verification.",
        Rejected: "Request has been rejected.",
      };

      const { error: historyError } = await supabase
        .from("request_status_history")
        .insert({
          request_id: requestId,
          status: newStatus,
          remarks:
            remarks[newStatus] || "Request status updated.",
        });

      if (historyError) {
        throw new Error(
          "Status updated, but history could not be saved: " +
            historyError.message
        );
      }

      setSuccessMessage(
        `Request #${requestId} updated to ${
          newStatus === "Completed"
            ? "Ready for Claiming"
            : newStatus
        }.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update request status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // DASHBOARD COUNTS
  const countStatus = (status: string) =>
    requests.filter(
      (request) => displayStatus(request) === status
    ).length;

  const pending = countStatus("Pending");
  const processing = countStatus("Processing");
  const approved = countStatus("Approved");
  const ready = countStatus("Ready for Claiming");
  const claimed = countStatus("Claimed");
  const rejected = countStatus("Rejected");
  const cancelled = countStatus("Cancelled");

  const documentTypes = Array.from(
    new Set(
      requests
        .map(documentName)
        .filter((name) => name !== "Unknown Document")
    )
  ).sort();

  // SEARCH AND FILTER
  const filteredRequests = requests.filter((request) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      request.id.toString().includes(search) ||
      documentName(request).toLowerCase().includes(search) ||
      (request.purpose || "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      displayStatus(request) === statusFilter;

    const matchesDocument =
      documentFilter === "All" ||
      documentName(request) === documentFilter;

    return matchesSearch && matchesStatus && matchesDocument;
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5]">
        <div className="text-center text-[#0b304b]">
          <Loader2
            size={34}
            className="mx-auto animate-spin"
          />

          <p className="mt-5 font-black">
            Loading Admin Dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 text-xs sm:px-8">
          <span className="font-bold uppercase tracking-widest">
            Digital Citizen Services Portal
          </span>

          <span className="hidden sm:block">
            Administrator Access
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="rounded-full border-2 border-[#d5bd81] p-3 text-[#d5bd81]">
              <Landmark size={22} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d5bd81]">
                Digital Barangay Portal
              </p>

              <p className="text-lg font-black">
                eBarangay Connect
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 border border-[#d5bd81]/50 px-4 py-2 text-xs font-bold text-[#d5bd81] md:inline-flex">
              <ShieldCheck size={16} />
              Administrator
            </span>

            <DashboardSwitcher current="admin" />

            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold transition hover:bg-white/10"
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
      <section className="relative overflow-hidden bg-[#0b304b] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage: "url('/barangay-hall.jpg')",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#d5bd81]">
            Administration
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Admin Dashboard
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9]">
            Review resident requests, manage document
            processing, and monitor documents awaiting
            claiming.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0b304b]"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* SUCCESS */}
        {successMessage && (
          <div
            role="status"
            className="mt-7 flex items-start gap-3 border-l-4 border-green-600 bg-green-50 p-5 text-green-800"
          >
            <CheckCircle2 size={20} />
            <p className="text-sm font-semibold">
              {successMessage}
            </p>
          </div>
        )}

        {/* ERROR */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-7 border-l-4 border-red-600 bg-red-50 p-5 text-sm text-red-800"
          >
            {errorMessage}
          </div>
        )}

        {/* STATUS SUMMARY */}
        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="Total Requests"
            count={requests.length}
            icon={FileText}
          />

          <StatCard
            title="Pending"
            count={pending}
            icon={Clock}
          />

          <StatCard
            title="Processing"
            count={processing}
            icon={Loader2}
          />

          <StatCard
            title="Approved"
            count={approved}
            icon={ShieldCheck}
          />

          <StatCard
            title="Ready for Claiming"
            count={ready}
            icon={CheckCircle2}
          />

          <StatCard
            title="Claimed"
            count={claimed}
            icon={QrCode}
          />

          <StatCard
            title="Rejected"
            count={rejected}
            icon={XCircle}
          />

          <StatCard
            title="Cancelled"
            count={cancelled}
            icon={Ban}
          />
        </section>

        {/* QR CLAIMING */}
        <section className="mt-8 border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#0b304b] text-[#d5bd81]">
                <QrCode size={26} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                  Document Release Management
                </p>

                <h2 className="mt-2 text-2xl font-black text-[#0b304b]">
                  QR Document Claiming
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[#697d8c]">
                  Verify completed document requests
                  before releasing them to residents.
                </p>
              </div>
            </div>

            <Link
              href="/admin/scan"
              className="inline-flex items-center justify-center gap-3 bg-[#0b304b] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#174b70]"
            >
              <QrCode size={19} />
              Scan QR Code
              <ArrowRight size={17} />
            </Link>
          </div>

          <p className="mt-5 border-t pt-4 text-xs leading-6 text-[#718391]">
            Only completed, unclaimed requests should
            be eligible for document release. QR
            verification must be completed by an
            authorized administrator.
          </p>
        </section>

        {/* FILTERS */}
        <section className="mt-8 border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <SlidersHorizontal
              size={23}
              className="text-[#0b304b]"
            />

            <h2 className="text-xl font-black text-[#0b304b]">
              Find Requests
            </h2>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <label className="block text-sm font-bold">
              Search Requests

              <div className="relative mt-2">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8193a2]"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="ID, document, or purpose"
                  className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-3 pl-12 pr-4 text-sm outline-none focus:border-[#0b304b]"
                />
              </div>
            </label>

            <label className="block text-sm font-bold">
              Request Status

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="mt-2 w-full border border-[#cdd9e2] bg-[#f8fafc] px-4 py-3 text-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Approved">Approved</option>
                <option value="Ready for Claiming">
                  Ready for Claiming
                </option>
                <option value="Claimed">Claimed</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            <label className="block text-sm font-bold">
              Document Type

              <select
                value={documentFilter}
                onChange={(event) =>
                  setDocumentFilter(event.target.value)
                }
                className="mt-2 w-full border border-[#cdd9e2] bg-[#f8fafc] px-4 py-3 text-sm"
              >
                <option value="All">All Documents</option>

                {documentTypes.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-6 border-t pt-5 text-sm text-[#697d8c]">
            Showing{" "}
            <strong className="text-[#0b304b]">
              {filteredRequests.length}
            </strong>{" "}
            of{" "}
            <strong className="text-[#0b304b]">
              {requests.length}
            </strong>{" "}
            requests
          </p>
        </section>

        {/* REQUEST LIST */}
        <section className="mt-10">
          <h2 className="mb-6 text-2xl font-black text-[#0b304b]">
            Document Requests
          </h2>

          {filteredRequests.length === 0 ? (
            <div className="border border-[#dce3e8] bg-white p-12 text-center">
              <Search
                size={30}
                className="mx-auto text-[#0b304b]"
              />

              <h3 className="mt-5 text-xl font-black text-[#0b304b]">
                No Matching Requests
              </h3>

              <p className="mt-3 text-sm text-[#697d8c]">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredRequests.map((request) => {
                const status = displayStatus(request);

                const locked =
                  status === "Cancelled" ||
                  status === "Claimed";

                return (
                  <article
                    key={request.id}
                    className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                          <FileText size={22} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                            Request #{request.id}
                          </p>

                          <h3 className="mt-2 wrap-break-words text-xl font-black text-[#0b304b]">
                            {documentName(request)}
                          </h3>

                          <p className="mt-3 wrap-break-word text-sm leading-7 text-[#697d8c]">
                            <strong className="text-[#173149]">
                              Purpose:
                            </strong>{" "}
                            {request.purpose ||
                              "No purpose provided."}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit shrink-0 items-center gap-2 px-4 py-2 text-xs font-black ${statusStyle(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-7 border-t border-[#e3e9ee] pt-6">
                      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                        <div>
                          <h4 className="text-sm font-black text-[#0b304b]">
                            Update Request Status
                          </h4>

                          {locked ? (
                            <p className="mt-3 text-sm text-[#697d8c]">
                              This request is {status.toLowerCase()}.
                              Its status can no longer be
                              changed.
                            </p>
                          ) : (
                            <>
                              <p className="mt-2 text-xs leading-6 text-[#718391]">
                                Select the appropriate
                                processing status.
                              </p>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map(
                                  (option) => (
                                    <button
                                      key={option}
                                      type="button"
                                      disabled={
                                        updatingId !== null ||
                                        request.status === option
                                      }
                                      onClick={() =>
                                        updateStatus(
                                          request.id,
                                          option
                                        )
                                      }
                                      className="inline-flex items-center gap-2 border border-[#cdd9e2] bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#0b304b] transition hover:bg-[#e8eef3] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {updatingId ===
                                      request.id ? (
                                        <Loader2
                                          size={15}
                                          className="animate-spin"
                                        />
                                      ) : null}

                                      {option ===
                                      "Completed"
                                        ? "Ready for Claiming"
                                        : option}
                                    </button>
                                  )
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <Link
                          href={`/admin/requests/${request.id}`}
                          className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#0b304b] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#174b70]"
                        >
                          View Details
                          <ArrowRight size={17} />
                        </Link>
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
      <footer className="mt-12 border-t border-[#dce3e8] bg-white">
        <div className="mx-auto max-w-7xl flex flex-col justify-between gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Administrator Request Management Portal</p>
        </div>
      </footer>
    </main>
  );
}
