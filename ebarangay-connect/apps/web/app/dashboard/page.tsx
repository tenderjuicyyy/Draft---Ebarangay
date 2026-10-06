"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Loading dashboard...
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Checking your account.
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
    <main className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-3xl font-bold">
              eBarangay Connect
            </h1>

            <p className="mt-2 text-gray-400">
              Welcome to your dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              href="/profile"
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              My Profile
            </Link>

            <Link
              href="/requests"
              className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              My Requests
            </Link>

            <Link
              href="/requests/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              New Request
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-red-800 bg-red-950 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>

          </div>

        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-800 bg-red-950 p-4">

            <p className="font-semibold text-red-300">
              Error
            </p>

            <p className="mt-1 text-sm text-red-400">
              {errorMessage}
            </p>

          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">

            <p className="text-sm text-gray-400">
              Total Requests
            </p>

            <p className="mt-2 text-3xl font-bold">
              {allRequests.length}
            </p>

          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">

            <p className="text-sm text-gray-400">
              Pending
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {pending}
            </p>

          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">

            <p className="text-sm text-gray-400">
              Processing
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-400">
              {processing}
            </p>

          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">

            <p className="text-sm text-gray-400">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {completed}
            </p>

          </div>

        </div>

        <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-5">

          <p className="text-sm text-gray-400">
            Rejected Requests
          </p>

          <p className="mt-2 text-3xl font-bold text-red-400">
            {rejected}
          </p>

        </div>

        <div className="mt-8">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-2xl font-bold">
              Recent Requests
            </h2>

            {allRequests.length > 0 && (
              <Link
                href="/requests"
                className="text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                View All
              </Link>
            )}

          </div>

          {allRequests.length === 0 ? (

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">

              <p className="text-gray-400">
                You have no document requests yet.
              </p>

              <Link
                href="/requests/new"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create New Request
              </Link>

            </div>

          ) : (

            <div className="overflow-hidden rounded-xl border border-gray-800">

              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead className="bg-gray-900">

                    <tr>

                      <th className="px-6 py-4">
                        Document
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4">
                        Request ID
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {allRequests.slice(0, 10).map((request) => {

                      const documentName = Array.isArray(
                        request.document_types
                      )
                        ? request.document_types[0]?.name
                        : request.document_types?.name;

                      return (
                        <tr
                          key={request.id}
                          className="border-t border-gray-800 bg-gray-950"
                        >

                          <td className="px-6 py-4">
                            {documentName || "Unknown Document"}
                          </td>

                          <td className="px-6 py-4">

                            <span
                              className={`rounded-full px-3 py-1 text-sm ${
                                request.status?.toLowerCase() === "completed"
                                  ? "bg-green-900 text-green-300"
                                  : request.status?.toLowerCase() === "processing"
                                  ? "bg-blue-900 text-blue-300"
                                  : request.status?.toLowerCase() === "rejected"
                                  ? "bg-red-900 text-red-300"
                                  : "bg-yellow-900 text-yellow-300"
                              }`}
                            >
                              {request.status || "Pending"}
                            </span>

                          </td>

                          <td className="px-6 py-4 text-gray-400">
                            #{request.id}
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </div>

      </div>
    </main>
  );
}