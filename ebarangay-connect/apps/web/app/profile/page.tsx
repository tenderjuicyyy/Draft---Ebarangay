"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  role: string | null;
};

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
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
        .from("profiles")
        .select(
          "id, full_name, email, phone_number, address, role"
        )
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage("Profile not found.");
        setLoading(false);
        return;
      }

      setProfile(data);
      setFullName(data.full_name || "");
      setPhoneNumber(data.phone_number || "");
      setAddress(data.address || "");

      setLoading(false);
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone_number: phoneNumber,
        address: address,
      })
      .eq("id", session.user.id)
      .select(
        "id, full_name, email, phone_number, address, role"
      )
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    if (data) {
      setProfile(data);
      setFullName(data.full_name || "");
      setPhoneNumber(data.phone_number || "");
      setAddress(data.address || "");
    }

    setSuccessMessage("Profile updated successfully.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Loading profile...
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Please wait.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-3xl">

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-blue-400 hover:text-blue-300"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            My Profile
          </h1>

          <p className="mt-2 text-gray-400">
            Manage your personal information.
          </p>
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

        {successMessage && (
          <div className="mb-6 rounded-xl border border-green-800 bg-green-950 p-4">
            <p className="font-semibold text-green-300">
              Success
            </p>

            <p className="mt-1 text-sm text-green-400">
              {successMessage}
            </p>
          </div>
        )}

        {profile && (
          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
          >

            <div className="space-y-6">

              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={profile.email || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-400"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Your email is managed by your account.
                </p>
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Phone Number
                </label>

                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(event.target.value)
                  }
                  placeholder="Enter your phone number"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-semibold text-gray-300"
                >
                  Address
                </label>

                <textarea
                  id="address"
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="Enter your address"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Account Role
                </label>

                <div className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-gray-400">
                  {profile.role || "resident"}
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-8 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </form>
        )}

      </div>
    </main>
  );
}