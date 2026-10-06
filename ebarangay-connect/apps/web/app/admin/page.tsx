"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type RequestItem = {
  id: number;
  status: string | null;
  purpose: string | null;
  document_types:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
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

  async function getCurrentUserAndCheckAdmin() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace("/login");
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError) {
      setErrorMessage(profileError.message);
      setLoading(false);
      return null;
    }

    if (!profile) {
      setErrorMessage(
        "Your profile was not found. Please make sure your profile exists in the profiles table."
      );
      setLoading(false);
      return null;
    }

    if (profile.role !== "admin") {
      router.replace("/dashboard");
      return null;
    }

    return session;
  }

  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndLoad() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

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

    checkAuthAndLoad();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function updateStatus(
    requestId: number,
    newStatus: string
  ) {
    setUpdatingId(requestId);
    setErrorMessage("");
    setSuccessMessage("");

    const session = await getCurrentUserAndCheckAdmin();

    if (!session) {
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
      setErrorMessage(updateError.message);
      setUpdatingId(null);
      return;
    }

    const remarks =
      newStatus === "Pending"
        ? "Request status changed to Pending."
        : newStatus === "Processing"
        ? "Request is now being processed."
        : newStatus === "Completed"
        ? "Request has been completed."
        : "Request has been rejected.";

    const { error: historyError } = await supabase
      .from("request_status_history")
      .insert({
        request_id: requestId,
        status: newStatus,
        remarks: remarks,
      });

    if (historyError) {
      setErrorMessage(
        `Status was updated, but history could not be saved: ${historyError.message}`
      );
      setUpdatingId(null);
      return;
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
      return request.document_types[0]?.name || "Unknown Document";
    }

    return request.document_types?.name || "Unknown Document";
  }

  function getStatusStyle(status: string | null) {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "processing":
        return "bg-blue-100 text-blue-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "pending":
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  }

  const pending = requests.filter(
    (request) => request.status?.toLowerCase() === "pending"
  ).length;

  const processing = requests.filter(
    (request) => request.status?.toLowerCase() === "processing"
  ).length;

  const completed = requests.filter(
    (request) => request.status?.toLowerCase() === "completed"
  ).length;

  const rejected = requests.filter(
    (request) => request.status?.toLowerCase() === "rejected"
  ).length;

  const documentTypes = Array.from(
    new Set(
      requests
        .map((request) => getDocumentName(request))
        .filter((name) => name !== "Unknown Document")
    )
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm text-slate-500">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-slate-900"
          >
            <ArrowLeft size={17} />
            eBarangay Connect
          </Link>

          <div className="flex items-center gap-3">

            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              Admin
            </span>

            <button
              type="button"
              onClick={logout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>

          </div>

        </div>
      </header>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-6 py-10">

        {/* TITLE */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Manage barangay document requests and update their status.
          </p>
        </div>

        {/* SUCCESS */}
        {successMessage && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">

            <p className="font-semibold text-green-700">
              Success
            </p>

            <p className="mt-1 text-sm text-green-600">
              {successMessage}
            </p>

          </div>
        )}

        {/* ERROR */}
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="font-semibold text-red-700">
              Error
            </p>

            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>

          </div>
        )}

        {/* STATISTICS */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Total Requests
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {requests.length}
            </p>

          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">

            <p className="text-sm text-yellow-700">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-700">
              {pending}
            </p>

          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

            <p className="text-sm text-blue-700">
              Processing
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {processing}
            </p>

          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">

            <p className="text-sm text-green-700">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {completed}
            </p>

          </div>

        </div>

        {/* REJECTED */}
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5">

          <p className="text-sm text-red-700">
            Rejected Requests
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">
            {rejected}
          </p>

        </div>

        {/* SEARCH + FILTERS */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* SEARCH */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search Requests
              </label>

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search by ID, document, or purpose..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />

              </div>

            </div>

            {/* STATUS FILTER */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filter by Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
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

              </select>

            </div>

            {/* DOCUMENT FILTER */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Filter by Document
              </label>

              <div className="relative">

                <FileText
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={documentFilter}
                  onChange={(event) =>
                    setDocumentFilter(event.target.value)
                  }
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
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

          {/* FILTER RESULT COUNT */}
          <div className="mt-4 border-t border-slate-100 pt-4">

            <p className="text-sm text-slate-500">

              Showing{" "}

              <span className="font-semibold text-slate-900">
                {filteredRequests.length}
              </span>

              {" "}of{" "}

              <span className="font-semibold text-slate-900">
                {requests.length}
              </span>

              {" "}requests

            </p>

          </div>

        </div>

        {/* REQUESTS */}
        <div className="mt-8">

          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Document Requests
          </h2>

          {filteredRequests.length === 0 ? (

            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">

              <p className="font-semibold text-slate-700">
                No matching requests found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredRequests.map((request) => (

                <div
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >

                  {/* REQUEST INFO */}
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">

                    <div>

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Request #{request.id}
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {getDocumentName(request)}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">

                        <span className="font-semibold">
                          Purpose:
                        </span>{" "}

                        {request.purpose || "No purpose provided."}

                      </p>

                    </div>

                    <div className="flex items-start">

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusStyle(
                          request.status
                        )}`}
                      >
                        {request.status || "Pending"}
                      </span>

                    </div>

                  </div>

                  {/* STATUS CONTROLS */}
                  <div className="mt-6 border-t border-slate-100 pt-5">

                    <p className="mb-3 text-sm font-semibold text-slate-800">
                      Update Status
                    </p>

                    <div className="flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(request.id, "Pending")
                        }
                        disabled={updatingId === request.id}
                        className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Clock size={16} />
                        Pending
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(request.id, "Processing")
                        }
                        disabled={updatingId === request.id}
                        className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Loader2 size={16} />
                        Processing
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(request.id, "Completed")
                        }
                        disabled={updatingId === request.id}
                        className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Check size={16} />
                        Completed
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(request.id, "Rejected")
                        }
                        disabled={updatingId === request.id}
                        className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X size={16} />
                        Rejected
                      </button>

                    </div>

                    {updatingId === request.id && (
                      <p className="mt-3 text-xs text-slate-500">
                        Updating request status...
                      </p>
                    )}

                    {/* VIEW DETAILS */}
                    <div className="mt-4">

                      <Link
                        href={`/admin/requests/${request.id}`}
                        className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        View Details
                      </Link>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

    </main>
  );
}