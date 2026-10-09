"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSwitcher from "@/components/DashboardSwitcher";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Landmark,
  LayoutDashboard,
  Loader2,
  LogOut,
  QrCode,
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

const STATUS_OPTIONS = [
  {
    name: "Pending",
    icon: Clock,
    style: "border-[#eadab8] bg-[#fffaf0] text-[#8e6b25] hover:bg-[#fbf1d9]",
  },
  {
    name: "Processing",
    icon: Loader2,
    style: "border-[#d4e3f1] bg-[#f4f8fc] text-[#255e91] hover:bg-[#e5eff9]",
  },
  {
    name: "Completed",
    icon: Check,
    style: "border-[#cde2d5] bg-[#f3faf5] text-[#28724e] hover:bg-[#e6f2eb]",
  },
  {
    name: "Rejected",
    icon: X,
    style: "border-[#efcfc9] bg-[#fdf6f4] text-[#a9473c] hover:bg-[#fae9e6]",
  },
];

function getDocumentName(request: RequestItem) {
  if (Array.isArray(request.document_types)) {
    return request.document_types[0]?.name || "Unknown Document";
  }

  return request.document_types?.name || "Unknown Document";
}

function getStatusStyle(status: string | null) {
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
  size = 15,
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

function StatCard({
  label,
  count,
  icon: Icon,
  cardStyle,
  iconStyle,
  textStyle,
}: {
  label: string;
  count: number;
  icon: typeof Clock;
  cardStyle: string;
  iconStyle: string;
  textStyle: string;
}) {
  return (
    <div className={`border p-5 shadow-sm ${cardStyle}`}>
      <div
        className={`mb-5 flex h-10 w-10 items-center justify-center ${iconStyle}`}
      >
        <Icon size={19} />
      </div>

      <p className={`text-3xl font-black ${textStyle}`}>{count}</p>

      <p
        className={`mt-2 text-xs font-bold uppercase tracking-wide ${textStyle}`}
      >
        {label}
      </p>
    </div>
  );
}

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

  // LOAD ADMIN DATA
  useEffect(() => {
    let cancelled = false;

    async function loadAdminData() {
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

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
        .select(
          `
          id,
          status,
          purpose,
          document_types (
            name
          )
        `,
        )
        .order("id", { ascending: false });

      if (cancelled) return;

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

  // UPDATE REQUEST STATUS
  async function updateStatus(requestId: number, newStatus: string) {
    const currentRequest = requests.find((request) => request.id === requestId);

    if (!currentRequest) return;

    if (currentRequest.status?.toLowerCase() === "cancelled") {
      setErrorMessage("Cancelled requests cannot be updated.");
      setSuccessMessage("");
      return;
    }

    if (currentRequest.status === newStatus) {
      setSuccessMessage(`Request #${requestId} is already ${newStatus}.`);
      setErrorMessage("");
      return;
    }

    setUpdatingId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      if (!profile || profile.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      const { error: updateError } = await supabase
        .from("document_requests")
        .update({ status: newStatus })
        .eq("id", requestId)
        .eq("status", currentRequest.status);

      if (updateError) {
        console.error("Status update error:", updateError);
        setErrorMessage(
          `Failed to update request status: ${updateError.message}`,
        );
        return;
      }

      const { data: updatedRequest, error: verifyError } = await supabase
        .from("document_requests")
        .select("id, status")
        .eq("id", requestId)
        .maybeSingle();

      if (verifyError) {
        setErrorMessage(
          `Status update verification failed: ${verifyError.message}`,
        );
        return;
      }

      if (!updatedRequest) {
        setErrorMessage("The request could not be found after updating.");
        return;
      }

      if (updatedRequest.status !== newStatus) {
        setErrorMessage(
          "The request status was not saved correctly. It may have changed elsewhere.",
        );
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
          remarks,
        });

      if (historyError) {
        console.error("History error:", historyError);
        setErrorMessage(
          `Status was saved, but history could not be saved: ${historyError.message}`,
        );
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request,
        ),
      );

      if (!historyError) {
        setSuccessMessage(`Request #${requestId} updated to ${newStatus}.`);
      }
    } finally {
      setUpdatingId(null);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const pending = requests.filter(
    (request) => request.status?.toLowerCase() === "pending",
  ).length;

  const processing = requests.filter(
    (request) => request.status?.toLowerCase() === "processing",
  ).length;

  const completed = requests.filter(
    (request) => request.status?.toLowerCase() === "completed",
  ).length;

  const rejected = requests.filter(
    (request) => request.status?.toLowerCase() === "rejected",
  ).length;

  const cancelledCount = requests.filter(
    (request) => request.status?.toLowerCase() === "cancelled",
  ).length;

  const documentTypes = Array.from(
    new Set(
      requests
        .map((request) => getDocumentName(request))
        .filter((name) => name !== "Unknown Document"),
    ),
  );

  const filteredRequests = requests.filter((request) => {
    const documentName = getDocumentName(request).toLowerCase();

    const purpose = request.purpose?.toLowerCase() || "";

    const requestId = request.id.toString();

    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      documentName.includes(search) ||
      purpose.includes(search) ||
      requestId.includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      request.status?.toLowerCase() === statusFilter.toLowerCase();

    const matchesDocument =
      documentFilter === "All" || getDocumentName(request) === documentFilter;

    return matchesSearch && matchesStatus && matchesDocument;
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-6 font-sans">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#0b304b] text-white">
            <Loader2 size={28} className="animate-spin" />
          </div>

          <p className="mt-5 text-lg font-black text-[#0b304b]">
            Loading admin dashboard
          </p>

          <p className="mt-2 text-sm text-[#697d8c]">
            Checking your administrator access...
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
            Administrator Access
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-4">
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

            <DashboardSwitcher current="admin" />

            <button
              type="button"
              onClick={logout}
              aria-label="Logout"
              className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b]"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
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
              Administration
            </p>
          </div>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Admin Dashboard
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
                Review resident document requests, monitor their progress, and
                manage request statuses from one place.
              </p>
            </div>

            <div className="flex w-fit items-center gap-4 border border-white/20 bg-white/10 px-5 py-4">
              <div className="flex h-11 w-11 items-center justify-center bg-[#d5bd81] text-[#0b304b]">
                <ShieldCheck size={21} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#c7d7e3]">
                  Access
                </p>

                <p className="mt-1 font-black text-white">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div
            role="status"
            className="mt-7 flex items-start gap-3 border-l-4 border-[#357c60] bg-[#edf7f1] px-6 py-5"
          >
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0 text-[#357c60]"
            />

            <div>
              <p className="font-black text-[#245e48]">Status Updated</p>

              <p className="mt-2 text-sm leading-7 text-[#376a55]">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-7 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">Something went wrong</p>

            <p className="mt-2 wrap-break-word text-sm leading-7 text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        )}

        {/* STATISTICS */}
        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total Requests"
            count={requests.length}
            icon={LayoutDashboard}
            cardStyle="border-[#dce3e8] bg-white"
            iconStyle="bg-[#e8eef3] text-[#0b304b]"
            textStyle="text-[#0b304b]"
          />

          <StatCard
            label="Pending"
            count={pending}
            icon={Clock}
            cardStyle="border-[#eadab8] bg-[#fffaf0]"
            iconStyle="bg-[#fbf1d9] text-[#8e6b25]"
            textStyle="text-[#8e6b25]"
          />

          <StatCard
            label="Processing"
            count={processing}
            icon={Loader2}
            cardStyle="border-[#d4e3f1] bg-[#f4f8fc]"
            iconStyle="bg-[#e5eff9] text-[#255e91]"
            textStyle="text-[#255e91]"
          />

          <StatCard
            label="Completed"
            count={completed}
            icon={CheckCircle2}
            cardStyle="border-[#cde2d5] bg-[#f3faf5]"
            iconStyle="bg-[#e6f2eb] text-[#28724e]"
            textStyle="text-[#28724e]"
          />

          <StatCard
            label="Rejected"
            count={rejected}
            icon={XCircle}
            cardStyle="border-[#efcfc9] bg-[#fdf6f4]"
            iconStyle="bg-[#fae9e6] text-[#a9473c]"
            textStyle="text-[#a9473c]"
          />

          <StatCard
            label="Cancelled"
            count={cancelledCount}
            icon={Ban}
            cardStyle="border-[#dce3e8] bg-[#f8fafb]"
            iconStyle="bg-[#eceff1] text-[#566775]"
            textStyle="text-[#566775]"
          />
        </section>

        {/* QR DOCUMENT CLAIMING - NEW FEATURE */}
        <section className="mt-8 overflow-hidden border border-[#dce3e8] bg-white shadow-sm">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#0b304b] text-[#d5bd81]">
                <QrCode size={27} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                  Document Release Management
                </p>

                <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                  QR Document Claiming
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#697d8c]">
                  Scan a resident&apos;s QR code to verify a completed document
                  request before confirming its release.
                </p>
              </div>
            </div>

            <Link
              href="/admin/scan"
              className="inline-flex shrink-0 items-center justify-center gap-3 bg-[#0b304b] px-7 py-4 text-sm font-black text-white transition hover:bg-[#174b70]"
            >
              <QrCode size={19} />
              Scan QR Code
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="border-t border-[#e3e9ee] bg-[#f8fafb] px-6 py-4 sm:px-8">
            <p className="text-xs leading-6 text-[#718391]">
              Only completed, unclaimed requests should be eligible for document
              release. Administrator verification is required.
            </p>
          </div>
        </section>

        {/* FILTERS */}
        <section className="mt-8 border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
              <SlidersHorizontal size={20} />
            </div>

            <div>
              <p className="text-xl font-black text-[#0b304b]">Find Requests</p>

              <p className="mt-2 text-sm leading-7 text-[#697d8c]">
                Search and filter resident document requests.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {/* SEARCH */}
            <div>
              <label
                htmlFor="request-search"
                className="mb-3 block text-sm font-black text-[#173149]"
              >
                Search Requests
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8193a2]"
                />

                <input
                  id="request-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ID, document, or purpose..."
                  className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-4 text-sm text-[#173149] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
                />
              </div>
            </div>

            {/* STATUS FILTER */}
            <div>
              <label
                htmlFor="status-filter"
                className="mb-3 block text-sm font-black text-[#173149]"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm font-semibold text-[#173149] outline-none transition focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
              >
                <option value="All">All Requests</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* DOCUMENT FILTER */}
            <div>
              <label
                htmlFor="document-filter"
                className="mb-3 block text-sm font-black text-[#173149]"
              >
                Document
              </label>

              <div className="relative">
                <FileText
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8193a2]"
                />

                <select
                  id="document-filter"
                  value={documentFilter}
                  onChange={(event) => setDocumentFilter(event.target.value)}
                  className="w-full appearance-none border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-4 text-sm font-semibold text-[#173149] outline-none transition focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
                >
                  <option value="All">All Documents</option>

                  {documentTypes.map((documentType) => (
                    <option key={documentType} value={documentType}>
                      {documentType}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#e3e9ee] pt-5">
            <p className="text-sm text-[#697d8c]">
              Showing{" "}
              <span className="font-black text-[#0b304b]">
                {filteredRequests.length}
              </span>{" "}
              of{" "}
              <span className="font-black text-[#0b304b]">
                {requests.length}
              </span>{" "}
              requests
            </p>
          </div>
        </section>

        {/* REQUEST LIST */}
        <section className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                Management
              </p>

              <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                Document Requests
              </h2>
            </div>

            <span className="hidden text-sm font-semibold text-[#718391] sm:block">
              {filteredRequests.length} displayed
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="border border-[#dce3e8] bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                <Search size={25} />
              </div>

              <h3 className="mt-6 text-xl font-black text-[#0b304b]">
                No Matching Requests
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#697d8c]">
                Try changing your search term or selecting different filters.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredRequests.map((request) => {
                const isCancelled =
                  request.status?.toLowerCase() === "cancelled";

                return (
                  <article
                    key={request.id}
                    className="overflow-hidden border border-[#dce3e8] bg-white shadow-sm"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                        <div className="flex min-w-0 gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                            <FileText size={22} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9b7b40]">
                              Request #{request.id}
                            </p>

                            <h3 className="mt-2 wrap-break-word text-xl font-black text-[#0b304b]">
                              {getDocumentName(request)}
                            </h3>

                            <p className="mt-4 max-w-2xl wrap-break-word text-sm leading-7 text-[#697d8c]">
                              <span className="font-black text-[#173149]">
                                Purpose:
                              </span>{" "}
                              {request.purpose || "No purpose provided."}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit shrink-0 items-center gap-2 px-4 py-2 text-xs font-black ${getStatusStyle(
                            request.status,
                          )}`}
                        >
                          <StatusIcon status={request.status} />
                          {request.status || "Pending"}
                        </span>
                      </div>

                      {/* STATUS CONTROLS */}
                      <div className="mt-7 border-t border-[#e3e9ee] pt-6">
                        {isCancelled ? (
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#eceff1] text-[#566775]">
                                <Ban size={19} />
                              </div>

                              <div>
                                <p className="text-sm font-black text-[#0b304b]">
                                  Cancelled by Resident
                                </p>

                                <p className="mt-2 max-w-xl text-xs leading-6 text-[#697d8c]">
                                  This request was cancelled by the resident
                                  while it was pending. Its processing status
                                  can no longer be changed.
                                </p>
                              </div>
                            </div>

                            <Link
                              href={`/admin/requests/${request.id}`}
                              className="inline-flex w-fit items-center justify-center gap-2 bg-[#0b304b] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70]"
                            >
                              View Details
                              <ArrowRight size={17} />
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                            <div>
                              <p className="text-sm font-black text-[#0b304b]">
                                Update Status
                              </p>

                              <p className="mt-2 text-xs leading-6 text-[#718391]">
                                Select the new processing status for this
                                request.
                              </p>

                              <div className="mt-5 flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map((option) => {
                                  const Icon = option.icon;

                                  return (
                                    <button
                                      key={option.name}
                                      type="button"
                                      onClick={() =>
                                        updateStatus(request.id, option.name)
                                      }
                                      disabled={updatingId !== null}
                                      className={`inline-flex items-center gap-2 border px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${option.style}`}
                                    >
                                      {updatingId === request.id &&
                                      option.name === "Processing" ? (
                                        <Loader2
                                          size={16}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <Icon size={16} />
                                      )}
                                      {option.name}
                                    </button>
                                  );
                                })}
                              </div>

                              {updatingId === request.id && (
                                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#718391]">
                                  <Loader2 size={14} className="animate-spin" />
                                  Updating request status...
                                </div>
                              )}
                            </div>

                            <Link
                              href={`/admin/requests/${request.id}`}
                              className="inline-flex w-fit items-center justify-center gap-2 bg-[#0b304b] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70]"
                            >
                              View Details
                              <ArrowRight size={17} />
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
      <footer className="mt-12 border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Administrator request management portal.</p>
        </div>
      </footer>
    </main>
  );
}
