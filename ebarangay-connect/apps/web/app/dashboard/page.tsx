
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSwitcher from "@/components/DashboardSwitcher";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  Loader2,
  LogOut,
  Menu,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  id: number;
  profile_id: string;
  status: string | null;
  document_types:
    | { name: string }
    | { name: string }[]
    | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkUserAndLoadRequests() {
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

      const userId = session.user.id;

      const { data, error } = await supabase
        .from("document_requests")
        .select(`
          id,
          profile_id,
          status,
          document_types (
            name
          )
        `)
        .eq("profile_id", userId)
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

    checkUserAndLoadRequests();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage("Logout error: " + error.message);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
  }

  function getDocumentName(request: RequestItem) {
    if (Array.isArray(request.document_types)) {
      return request.document_types[0]?.name || "Unknown Document";
    }

    return request.document_types?.name || "Unknown Document";
  }

  function getStatusStyle(status: string | null) {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "completed") {
      return "bg-[#e6f2eb] text-[#28724e]";
    }

    if (normalizedStatus === "processing") {
      return "bg-[#e5eff9] text-[#255e91]";
    }

    if (normalizedStatus === "rejected") {
      return "bg-[#fae9e6] text-[#a9473c]";
    }

    if (normalizedStatus === "cancelled") {
      return "bg-[#eceff1] text-[#566775]";
    }

    return "bg-[#fbf1d9] text-[#8e6b25]";
  }

  function getStatusIcon(status: string | null) {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "completed") {
      return <CheckCircle2 size={15} />;
    }

    if (normalizedStatus === "processing") {
      return <Loader2 size={15} />;
    }

    if (normalizedStatus === "rejected") {
      return <XCircle size={15} />;
    }

    if (normalizedStatus === "cancelled") {
      return <Ban size={15} />;
    }

    return <Clock3 size={15} />;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] font-sans">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#0b304b] text-white">
            <Loader2 size={28} className="animate-spin" />
          </div>

          <p className="mt-5 text-lg font-black text-[#0b304b]">
            Loading your dashboard
          </p>

          <p className="mt-2 text-sm text-[#697d8c]">
            Getting your barangay requests ready.
          </p>
        </div>
      </main>
    );
  }

  const allRequests = requests;

  const pending = allRequests.filter(
    (request) => request.status?.toLowerCase() === "pending"
  ).length;

  const processing = allRequests.filter(
    (request) => request.status?.toLowerCase() === "processing"
  ).length;

  const completed = allRequests.filter(
    (request) => request.status?.toLowerCase() === "completed"
  ).length;

  const rejected = allRequests.filter(
    (request) => request.status?.toLowerCase() === "rejected"
  ).length;

  const cancelledCount = allRequests.filter(
    (request) => request.status?.toLowerCase() === "cancelled"
  ).length;

  const stats = [
    {
      label: "Total Requests",
      value: allRequests.length,
      icon: FileText,
      color: "text-[#0b304b]",
      background: "bg-[#e8eef3]",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock3,
      color: "text-[#9b7b40]",
      background: "bg-[#fbf1d9]",
    },
    {
      label: "Processing",
      value: processing,
      icon: Loader2,
      color: "text-[#255e91]",
      background: "bg-[#e5eff9]",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-[#28724e]",
      background: "bg-[#e6f2eb]",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "text-[#a9473c]",
      background: "bg-[#fae9e6]",
    },
    {
      label: "Cancelled",
      value: cancelledCount,
      icon: Ban,
      color: "text-[#566775]",
      background: "bg-[#eceff1]",
    },
  ];

  const documentServices = [
    {
      title: "Barangay Clearance",
      description:
        "Request your barangay clearance through the online document request system.",
      icon: FileCheck2,
    },
    {
      title: "Certificate of Residency",
      description:
        "Submit a request for proof of residency from your barangay.",
      icon: Home,
    },
    {
      title: "Certificate of Indigency",
      description:
        "Request a Certificate of Indigency and monitor its processing status online.",
      icon: FileText,
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP BAR */}
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

      {/* NAVIGATION */}
      <header className="relative z-20 bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
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

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              href="/dashboard"
              className="border-b-2 border-[#d5bd81] pb-1 text-xs font-bold uppercase tracking-wide text-[#e2c991]"
            >
              Dashboard
            </Link>

            <Link
              href="/requests"
              className="text-xs font-bold uppercase tracking-wide transition hover:text-[#e2c991]"
            >
              My Requests
            </Link>

            <Link
              href="/requests/new"
              className="text-xs font-bold uppercase tracking-wide transition hover:text-[#e2c991]"
            >
              New Request
            </Link>

            <Link
              href="/profile"
              className="text-xs font-bold uppercase tracking-wide transition hover:text-[#e2c991]"
            >
              Profile
            </Link>
          </nav>

          {/* DESKTOP LOGOUT BUTTON */}
          <div className="hidden items-center lg:flex">
            <DashboardSwitcher current="resident" />

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Logout"
              className="inline-flex items-center justify-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:border-[#d5bd81] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  LOGGING OUT...
                </>
              ) : (
                <>
                  <LogOut size={16} strokeWidth={1.7} />
                  LOGOUT
                </>
              )}
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex h-11 w-11 items-center justify-center border border-white/30 lg:hidden"
          >
            {mobileMenuOpen ? (
              <X size={21} />
            ) : (
              <Menu size={21} />
            )}
          </button>
        </div>

        {/* MOBILE NAVIGATION */}
        {mobileMenuOpen && (
          <nav className="border-t border-white/20 bg-[#09283e] px-5 py-5 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              <Link
                href="/dashboard"
                className="bg-white/10 px-4 py-3 text-sm font-bold text-[#e2c991]"
              >
                Dashboard
              </Link>

              <Link
                href="/requests"
                className="px-4 py-3 text-sm font-semibold hover:bg-white/10"
              >
                My Requests
              </Link>

              <Link
                href="/requests/new"
                className="px-4 py-3 text-sm font-semibold hover:bg-white/10"
              >
                New Request
              </Link>

              <Link
                href="/profile"
                className="px-4 py-3 text-sm font-semibold hover:bg-white/10"
              >
                My Profile
              </Link>

              <DashboardSwitcher current="resident" />

              {/* MOBILE LOGOUT BUTTON */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-2 inline-flex items-center gap-2 self-start border border-white/30 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-[#d5bd81] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingOut ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    LOGGING OUT...
                  </>
                ) : (
                  <>
                    <LogOut size={16} strokeWidth={1.7} />
                    LOGOUT
                  </>
                )}
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="mx-auto max-w-7xl px-5 pt-7 sm:px-8">
          <div
            role="alert"
            className="border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-5 py-4"
          >
            <p className="font-bold text-[#943d31]">
              Something went wrong
            </p>

            <p className="mt-2 text-sm text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* FULL-WIDTH HERO */}
      <section className="relative w-full overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{
            backgroundImage: "url('/barangay-hall.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-[#061b2b]/85 via-[#0b304b]/55 to-[#0b304b]/25" />

        <div className="relative mx-auto grid min-h-97.5 max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
          {/* LEFT CONTENT */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-[#d5bd81]" />

              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e2c991]">
                Resident Dashboard
              </span>
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              Barangay services,
              <br />
              made simple.
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-8 text-[#d6e1e9]">
              Request barangay documents, monitor their progress,
              and manage your services from one convenient place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/requests/new"
                className="inline-flex items-center gap-2 border-2 border-[#d5bd81] bg-[#d5bd81] px-6 py-3 text-sm font-black text-[#0b304b] transition hover:bg-white"
              >
                Create New Request
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/requests"
                className="inline-flex items-center gap-2 border-2 border-white/50 px-6 py-3 text-sm font-bold text-white transition hover:bg-white hover:text-[#0b304b]"
              >
                Track My Requests
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
                <FileText size={18} className="text-[#e2c991]" />
                Easy Requests
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
                <Clock3 size={18} className="text-[#e2c991]" />
                Status Tracking
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
                <FileCheck2 size={18} className="text-[#e2c991]" />
                Digital Records
              </div>
            </div>
          </div>

          {/* LIVE REQUEST SUMMARY */}
          <div className="border border-white/20 bg-[#061b2b]/70 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e2c991]">
                  Your Requests
                </p>

                <p className="mt-3 text-5xl font-black">
                  {allRequests.length}
                </p>

                <p className="mt-2 text-xs text-[#b9cbd8]">
                  Total submitted requests
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center border border-white/20 bg-white/10 text-[#e2c991]">
                <FileText size={25} />
              </div>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-3">
              <div className="border border-white/15 bg-white/10 p-5">
                <p className="text-xs text-[#c7d7e3]">
                  Processing
                </p>

                <p className="mt-2 text-3xl font-black">
                  {processing}
                </p>
              </div>

              <div className="border border-[#d5bd81]/40 bg-[#d5bd81] p-5 text-[#0b304b]">
                <p className="text-xs font-semibold">
                  Completed
                </p>

                <p className="mt-2 text-3xl font-black">
                  {completed}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
        {/* REQUEST STATISTICS */}
        <section className="pb-9">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
              Request Overview
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#0b304b] sm:text-3xl">
              Your Request Statistics
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="border border-[#dce3e8] bg-white p-5 shadow-sm"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center ${stat.background} ${stat.color}`}
                  >
                    <Icon size={20} />
                  </div>

                  <p className="mt-5 text-3xl font-black text-[#0b304b]">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[#718391]">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* AVAILABLE DOCUMENTS */}
        <section className="py-12">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
              Barangay Services
            </p>

            <h2 className="mt-2 text-2xl font-black text-[#0b304b] sm:text-3xl">
              Available Documents
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {documentServices.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="border border-[#dce3e8] bg-white p-7 shadow-sm"
                >
                  <div className="flex h-14 w-14 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-6 text-lg font-black text-[#0b304b]">
                    {service.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                    {service.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* RECENT REQUESTS */}
        <section className="border border-[#dce3e8] bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#dce3e8] pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                Request Activity
              </p>

              <h2 className="mt-2 text-2xl font-black text-[#0b304b]">
                Recent Requests
              </h2>
            </div>

            {allRequests.length > 0 && (
              <Link
                href="/requests"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
              >
                View All
                <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {allRequests.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                <FileText size={24} />
              </div>

              <h3 className="mt-5 font-black text-[#0b304b]">
                No document requests yet
              </h3>

              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#697d8c]">
                Your submitted document requests will appear here
              </p>

            </div>
          ) : (
            <div className="mt-2">
              {allRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-4 border-b border-[#e3e9ee] py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                      <FileText size={21} />
                    </div>

                    <div>
                      <p className="font-black text-[#0b304b]">
                        {getDocumentName(request)}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-[#8193a2]">
                        Request #{request.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold ${getStatusStyle(
                        request.status
                      )}`}
                    >
                      {getStatusIcon(request.status)}
                      {request.status || "Pending"}
                    </span>

                    <Link
                      href={`/requests/${request.id}`}
                      aria-label={`View request ${request.id}`}
                      className="flex h-10 w-10 items-center justify-center border border-[#dce3e8] text-[#0b304b] transition hover:bg-[#e8eef3]"
                    >
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="mt-9 flex flex-col gap-3 border-t border-[#d4dfe7] py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between">
          <p>2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </footer>
      </div>
    </main>
  );
}
