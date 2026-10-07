"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileText,
  Home,
  Loader2,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestItem = {
  id: number;
  profile_id: string;
  status: string | null;
  document_types:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
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

      if (cancelled) {
        return;
      }

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

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setRequests(data || []);
      setLoading(false);
    }

    checkUserAndLoadRequests();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

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
      return "bg-[#dfe9d5] text-[#435332]";
    }

    if (normalizedStatus === "processing") {
      return "bg-[#e9e3cd] text-[#6b6037]";
    }

    if (normalizedStatus === "rejected") {
      return "bg-[#f3ddd5] text-[#9a4f3c]";
    }

    return "bg-[#f4e7cf] text-[#9a672e]";
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

    return <Clock3 size={15} />;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f0e4]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#465032] text-[#f7f2e7]">
            <Loader2 size={28} className="animate-spin" />
          </div>

          <p className="mt-5 text-lg font-bold text-[#25281e]">
            Loading your dashboard
          </p>

          <p className="mt-1 text-sm text-[#777465]">
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

  return (
    <main className="min-h-screen bg-[#77794f] px-3 py-3 text-[#25281e] sm:px-5 sm:py-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-[28px] bg-[#f4f0e4] shadow-2xl sm:min-h-[calc(100vh-40px)] sm:rounded-[36px]">

        {/* NAVIGATION */}
        <header className="relative border-b border-[#dcd5c4] bg-[#f7f3e9]">
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

            <nav className="hidden items-center gap-8 lg:flex">
              <Link
                href="/dashboard"
                className="text-sm font-bold text-[#4c5335]"
              >
                Dashboard
              </Link>

              <Link
                href="/requests"
                className="text-sm font-semibold text-[#555548] transition hover:text-[#4c5335]"
              >
                My Requests
              </Link>

              <Link
                href="/requests/new"
                className="text-sm font-semibold text-[#555548] transition hover:text-[#4c5335]"
              >
                New Request
              </Link>

              <Link
                href="/profile"
                className="text-sm font-semibold text-[#555548] transition hover:text-[#4c5335]"
              >
                Profile
              </Link>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/requests/new"
                className="rounded-full bg-[#c96f46] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b8613d]"
              >
                Request Document
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3ccba] text-[#555548] transition hover:bg-[#ebe5d7] disabled:cursor-not-allowed disabled:opacity-50"
                title="Logout"
              >
                {loggingOut ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <LogOut size={17} />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d3ccba] lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-[#ddd6c5] bg-[#f7f3e9] px-5 py-5 lg:hidden">
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-[#ebe5d7] px-4 py-3 text-sm font-bold"
                >
                  Dashboard
                </Link>

                <Link
                  href="/requests"
                  className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#ebe5d7]"
                >
                  My Requests
                </Link>

                <Link
                  href="/requests/new"
                  className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#ebe5d7]"
                >
                  New Request
                </Link>

                <Link
                  href="/profile"
                  className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[#ebe5d7]"
                >
                  My Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-2 rounded-xl bg-[#c96f46] px-4 py-3 text-left text-sm font-bold text-white"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </header>

        <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">

          {/* ERROR */}
          {errorMessage && (
            <div className="mb-6 rounded-[22px] border border-[#dfb9aa] bg-[#f7e5de] p-5">
              <p className="font-bold text-[#8d4938]">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-[#9b5a49]">
                {errorMessage}
              </p>
            </div>
          )}

          {/* HERO */}
          <section className="relative overflow-hidden rounded-4xl bg-[#ebe5d5]">
            <div className="grid min-h-97.5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12 lg:py-12">
                <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-[#cfc6ae] bg-[#f5f0e4] px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-[#778052]" />

                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#65664e]">
                    Resident Portal
                  </span>
                </div>

                <h1 className="max-w-xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-[#25271e] sm:text-5xl lg:text-6xl">
                  Barangay services,
                  <br />
                  made simple.
                </h1>

                <p className="mt-5 max-w-lg text-sm leading-6 text-[#68675b] sm:text-base">
                  Request barangay documents, monitor their progress,
                  and manage your services from one convenient place.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/requests/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#c96f46] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#b8613d]"
                  >
                    Create New Request
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    href="/requests"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#cbc3af] bg-[#f7f2e7] px-5 py-3 text-sm font-bold text-[#4e513d] transition hover:bg-white"
                  >
                    Track My Requests
                  </Link>
                </div>

                <div className="mt-9 flex flex-wrap gap-x-7 gap-y-4">
                  <div className="flex items-center gap-2">
                    <FileText
                      size={18}
                      className="text-[#747b51]"
                    />
                    <span className="text-xs font-bold text-[#555748]">
                      Easy Requests
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock3
                      size={18}
                      className="text-[#747b51]"
                    />
                    <span className="text-xs font-bold text-[#555748]">
                      Status Tracking
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCheck2
                      size={18}
                      className="text-[#747b51]"
                    />
                    <span className="text-xs font-bold text-[#555748]">
                      Digital Records
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative dashboard visual */}
              <div className="relative hidden min-h-97.5 overflow-hidden lg:block">
                <div className="absolute inset-6 overflow-hidden rounded-[80px_24px_24px_80px] bg-[#505738]">
                  <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-30 border-[#68704a]" />

                  <div className="absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-[#626a45]" />

                  <div className="relative flex h-full flex-col justify-between p-9 text-[#f7f2e7]">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8d7c1]">
                          Your Requests
                        </p>

                        <p className="mt-2 text-5xl font-black">
                          {allRequests.length}
                        </p>
                      </div>

                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3eee1] text-[#505738]">
                        <FileText size={25} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#f4efe2]/95 p-4 text-[#303427]">
                        <p className="text-xs font-semibold text-[#737263]">
                          Processing
                        </p>

                        <p className="mt-1 text-2xl font-black">
                          {processing}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#d5a078] p-4 text-white">
                        <p className="text-xs font-semibold text-white/80">
                          Completed
                        </p>

                        <p className="mt-1 text-2xl font-black">
                          {completed}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* STATS */}
          <section className="grid grid-cols-2 gap-3 py-7 lg:grid-cols-5">
            <div className="rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8e4d6] text-[#62684a]">
                <FileText size={17} />
              </div>

              <p className="mt-4 text-3xl font-black">
                {allRequests.length}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Total Requests
              </p>
            </div>

            <div className="rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4e7cf] text-[#9a672e]">
                <Clock3 size={17} />
              </div>

              <p className="mt-4 text-3xl font-black">
                {pending}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Pending
              </p>
            </div>

            <div className="rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9e3cd] text-[#756a40]">
                <Loader2 size={17} />
              </div>

              <p className="mt-4 text-3xl font-black">
                {processing}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Processing
              </p>
            </div>

            <div className="rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfe9d5] text-[#52633e]">
                <CheckCircle2 size={17} />
              </div>

              <p className="mt-4 text-3xl font-black">
                {completed}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Completed
              </p>
            </div>

            <div className="col-span-2 rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5 lg:col-span-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3ddd5] text-[#9a4f3c]">
                <XCircle size={17} />
              </div>

              <p className="mt-4 text-3xl font-black">
                {rejected}
              </p>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#777465]">
                Rejected
              </p>
            </div>
          </section>

          {/* QUICK SERVICES */}
          <section className="rounded-[28px] bg-[#4d5435] p-6 text-[#f7f2e7] sm:p-8">
            <div className="grid gap-7 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="flex flex-col justify-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d2d4bb]">
                  Quick Access
                </p>

                <h2 className="mt-2 text-3xl font-black leading-tight">
                  Manage your barangay services
                </h2>

                <p className="mt-3 max-w-sm text-sm leading-6 text-[#d2d4c4]">
                  Everything you need for your document requests is
                  available from your resident dashboard.
                </p>

                <Link
                  href="/requests"
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-[#c96f46] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#b8613d]"
                >
                  View All Requests
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/requests/new"
                  className="group rounded-[22px] bg-[#f4efe3] p-5 text-[#292c21] transition hover:-translate-y-1"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e4dcc7] text-[#58603e]">
                    <FilePlus2 size={20} />
                  </div>

                  <p className="mt-5 font-black">
                    New Document Request
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#777465]">
                    Submit a new request for an available barangay document.
                  </p>
                </Link>

                <Link
                  href="/requests"
                  className="group rounded-[22px] bg-[#f4efe3] p-5 text-[#292c21] transition hover:-translate-y-1"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e4dcc7] text-[#58603e]">
                    <Search size={20} />
                  </div>

                  <p className="mt-5 font-black">
                    Track Requests
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#777465]">
                    Check the current status and history of your requests.
                  </p>
                </Link>

                <Link
                  href="/requests"
                  className="group rounded-[22px] bg-[#f4efe3] p-5 text-[#292c21] transition hover:-translate-y-1"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e4dcc7] text-[#58603e]">
                    <FileText size={20} />
                  </div>

                  <p className="mt-5 font-black">
                    My Requests
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#777465]">
                    Review all document requests connected to your account.
                  </p>
                </Link>

                <Link
                  href="/profile"
                  className="group rounded-[22px] bg-[#f4efe3] p-5 text-[#292c21] transition hover:-translate-y-1"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e4dcc7] text-[#58603e]">
                    <UserRound size={20} />
                  </div>

                  <p className="mt-5 font-black">
                    My Profile
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#777465]">
                    View and update your resident account information.
                  </p>
                </Link>
              </div>
            </div>
          </section>

          {/* DOCUMENT SERVICES */}
          <section className="py-9">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                  Barangay Services
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Available documents
                </h2>
              </div>

              <Link
                href="/requests/new"
                className="hidden text-sm font-bold text-[#b55f3b] hover:text-[#944a2e] sm:block"
              >
                Request a document →
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/requests/new"
                className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#cfc8b5] text-[#62694a]">
                  <FileCheck2 size={21} />
                </div>

                <h3 className="mt-5 text-lg font-black">
                  Barangay Clearance
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#747265]">
                  Request your barangay clearance through the online
                  document request system.
                </p>

                <p className="mt-5 text-sm font-bold text-[#b55f3b]">
                  Request document →
                </p>
              </Link>

              <Link
                href="/requests/new"
                className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#cfc8b5] text-[#62694a]">
                  <Home size={21} />
                </div>

                <h3 className="mt-5 text-lg font-black">
                  Certificate of Residency
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#747265]">
                  Submit a request for proof of residency from your
                  barangay.
                </p>

                <p className="mt-5 text-sm font-bold text-[#b55f3b]">
                  Request document →
                </p>
              </Link>

              <Link
                href="/requests/new"
                className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#cfc8b5] text-[#62694a]">
                  <FileText size={21} />
                </div>

                <h3 className="mt-5 text-lg font-black">
                  Certificate of Indigency
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#747265]">
                  Request a Certificate of Indigency and monitor its
                  processing status online.
                </p>

                <p className="mt-5 text-sm font-bold text-[#b55f3b]">
                  Request document →
                </p>
              </Link>
            </div>
          </section>

          {/* RECENT REQUESTS */}
          <section className="rounded-[28px] border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-[#ddd6c5] pb-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                  Request Activity
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Recent Requests
                </h2>
              </div>

              {allRequests.length > 0 && (
                <Link
                  href="/requests"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#b55f3b] hover:text-[#944a2e]"
                >
                  View All
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>

            {allRequests.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e9e3d4] text-[#676d4b]">
                  <FileText size={23} />
                </div>

                <h3 className="mt-4 font-black">
                  No document requests yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#777465]">
                  Your submitted document requests will appear here
                  once you create one.
                </p>

                <Link
                  href="/requests/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#c96f46] px-5 py-3 text-sm font-bold text-white hover:bg-[#b8613d]"
                >
                  Create New Request
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="mt-2">
                {allRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 border-b border-[#e2dccd] py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9e3d4] text-[#616849]">
                        <FileText size={20} />
                      </div>

                      <div>
                        <p className="font-black text-[#2b2e23]">
                          {getDocumentName(request)}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#8a8778]">
                          Request #{request.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status || "Pending"}
                      </span>

                      <Link
                        href="/requests"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d5cebd] text-[#686858] transition hover:bg-[#ebe5d7]"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* BOTTOM CTA */}
          <section className="mt-8 overflow-hidden rounded-[28px] bg-[#4d5435] px-7 py-8 text-[#f7f2e7] sm:px-9">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d0d2b8]">
                  eBarangay Connect
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Need a barangay document?
                </h2>

                <p className="mt-2 text-sm text-[#d6d6c7]">
                  Submit your request online and track its progress from
                  your dashboard.
                </p>
              </div>

              <Link
                href="/requests/new"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#c96f46] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#b8613d]"
              >
                Start a Request
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-8 flex flex-col gap-3 border-t border-[#d9d2c1] py-6 text-xs text-[#858273] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © 2026 eBarangay Connect
            </p>

            <p>
              Digital barangay services for residents.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

