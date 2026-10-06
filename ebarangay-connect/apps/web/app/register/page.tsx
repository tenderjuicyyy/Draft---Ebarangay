"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanedName = fullName.trim();
    const cleanedEmail = email.trim();

    if (!cleanedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: cleanedEmail,
      password,
      options: {
        data: {
          full_name: cleanedName,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setErrorMessage("Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      return;
    }

    setSuccessMessage(
      "Account created successfully! Please check your email to verify your account, then log in."
    );

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white">
              <FileText size={21} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Create resident account
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Register to submit and track your barangay document requests.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-700">{successMessage}</p>

              <Link
                href="/login"
                className="mt-2 inline-block text-sm font-semibold text-green-700 hover:underline"
              >
                Go to Login
              </Link>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full name
              </label>

              <input
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Juan Dela Cruz"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirm password
              </label>

              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-700 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

