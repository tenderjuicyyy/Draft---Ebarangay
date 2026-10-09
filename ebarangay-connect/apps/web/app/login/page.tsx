"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Forgot-password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  // LOGIN WITH ROLE-BASED REDIRECTION
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Authenticate the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.user) {
        setErrorMessage("Unable to identify your account. Please try again.");
        return;
      }

      // 2. Retrieve the user's role from the profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile lookup failed:", profileError.message);

        await supabase.auth.signOut();

        setErrorMessage(
          "Unable to verify your account role. Please try again.",
        );
        return;
      }

      // 3. Handle accounts without a profile
      if (!profile) {
        await supabase.auth.signOut();

        setErrorMessage(
          "Your profile was not found. Please contact the administrator.",
        );
        return;
      }

      // 4. Redirect according to the verified role
      if (profile.role === "admin") {
        router.replace("/admin");
      } else if (profile.role === "resident") {
        router.replace("/dashboard");
      } else {
        await supabase.auth.signOut();

        setErrorMessage(
          "Your account role is not recognized. Please contact the administrator.",
        );
      }
    } catch (error) {
      console.error("Login error:", error);

      setErrorMessage(
        "Something went wrong while signing in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // FORGOT PASSWORD
  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setResetError("Please enter your registered email address.");
      setResetMessage("");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetMessage("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo },
      );

      if (error) {
        setResetError(
          "We could not send the reset email. Please try again later.",
        );
        return;
      }

      setResetMessage(
        "If an account exists for this email address, a password reset link has been sent. Please check your inbox and spam folder.",
      );
    } catch {
      setResetError(
        "A connection error occurred. Please check your internet connection and try again.",
      );
    } finally {
      setResetLoading(false);
    }
  }

  function openForgotPassword() {
    setShowForgotPassword(true);
    setErrorMessage("");
    setResetError("");
    setResetMessage("");
  }

  function returnToLogin() {
    setShowForgotPassword(false);
    setErrorMessage("");
    setResetError("");
    setResetMessage("");
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
            Mines View, Baguio City, Philippines
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
              <Landmark size={23} strokeWidth={1.7} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d5bd81]">
                Digital Barangay Portal
              </p>

              <p className="mt-1 text-lg font-black tracking-tight sm:text-xl">
                eBarangay Connect
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="hidden items-center gap-2 border border-white/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b] sm:inline-flex"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto grid min-h-[calc(100vh-132px)] max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">
        {/* LEFT INFORMATION PANEL */}
        <section className="relative hidden overflow-hidden bg-[#102f48] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-75"
            style={{
              backgroundImage: "url('/barangay-hall.jpg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-[#0b304b]/95 via-[#0b304b]/80 to-[#061b2b]/95" />

          <div className="relative z-10">
            <div className="mb-8 h-1 w-14 bg-[#d5bd81]" />

            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#e2c991]">
              Resident Portal
            </p>

            <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight xl:text-6xl">
              Welcome
              <br />
              back.
            </h1>

            <p className="mt-7 max-w-md text-sm leading-8 text-[#d6e1e9]">
              Access your resident dashboard to request barangay documents,
              monitor their progress, and manage your transactions online.
            </p>

            <div className="mt-12 space-y-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-[#e2c991]">
                  <FileText size={20} />
                </div>

                <div>
                  <p className="text-sm font-bold">Manage document requests</p>
                  <p className="mt-2 text-xs leading-6 text-[#c1d0dc]">
                    Access all your barangay requests.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-[#e2c991]">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <p className="text-sm font-bold">Track request status</p>
                  <p className="mt-2 text-xs leading-6 text-[#c1d0dc]">
                    See pending, processing, and completed requests.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-[#e2c991]">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <p className="text-sm font-bold">Secure account access</p>
                  <p className="mt-2 text-xs leading-6 text-[#c1d0dc]">
                    Your account keeps your requests organized.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-14 border-t border-white/20 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aebfcd]">
              eBarangay Connect — Digital Citizen Services
            </p>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="flex flex-col bg-white">
          {/* MOBILE BACK LINK */}
          <div className="px-6 pt-7 sm:px-10 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b304b]"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 sm:py-14 lg:px-14">
            <div className="w-full max-w-md">
              {/* HEADING */}
              <div className="mb-9">
                <div className="mb-6 flex h-14 w-14 items-center justify-center bg-[#0b304b] text-white">
                  <LockKeyhole size={24} />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b40]">
                  Secure Account Access
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0b304b] sm:text-4xl">
                  {showForgotPassword
                    ? "Recover your account"
                    : "Sign in to your account"}
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#697d8c]">
                  {showForgotPassword
                    ? "Enter your registered email address and we will send you a secure password reset link."
                    : "Enter your registered email and password to access your eBarangay Connect account."}
                </p>
              </div>

              {/* LOGIN ERROR */}
              {errorMessage && !showForgotPassword && (
                <div
                  role="alert"
                  className="mb-6 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-5 py-4"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-[#943d31]">
                    Login failed
                  </p>

                  <p className="mt-2 text-sm text-[#943d31]">{errorMessage}</p>
                </div>
              )}

              {/* FORGOT PASSWORD FORM */}
              {showForgotPassword ? (
                <section aria-labelledby="forgot-password-heading">
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b40]">
                      Account recovery
                    </p>

                    <h3
                      id="forgot-password-heading"
                      className="mt-2 text-2xl font-black tracking-tight text-[#0b304b]"
                    >
                      Forgot your password?
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                      We will email you a link to create a new password.
                    </p>
                  </div>

                  {resetError && (
                    <div
                      role="alert"
                      className="mb-5 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-4 py-3 text-sm text-[#943d31]"
                    >
                      {resetError}
                    </div>
                  )}

                  {resetMessage && (
                    <div
                      role="status"
                      className="mb-5 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                    >
                      {resetMessage}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-5">
                    <div>
                      <label
                        htmlFor="reset-email"
                        className="mb-2 block text-sm font-bold text-[#173149]"
                      >
                        Email address
                      </label>

                      <div className="relative">
                        <Mail
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8497a5]"
                        />

                        <input
                          id="reset-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-4 text-sm text-[#172b3d] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#0b304b] px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending link...
                        </>
                      ) : (
                        <>
                          Send reset link
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={returnToLogin}
                    className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
                  >
                    <ArrowLeft size={16} />
                    Back to sign in
                  </button>
                </section>
              ) : (
                /* LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-bold text-[#173149]"
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8497a5]"
                      />

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-4 text-sm text-[#172b3d] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="password"
                        className="block text-sm font-bold text-[#173149]"
                      >
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs font-bold text-[#0b557b] transition hover:text-[#9b7b40] sm:text-sm"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8497a5]"
                      />

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-12 text-sm text-[#172b3d] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8497a5] transition hover:text-[#0b304b]"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#0b304b] px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* CREATE ACCOUNT */}
              <div className="mt-9 border border-[#dce3e8] bg-[#f5f8fa] p-6 text-center">
                <p className="text-sm text-[#697d8c]">
                  Don&apos;t have a resident account?
                </p>

                <Link
                  href="/register"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#0b304b] transition hover:text-[#9b7b40]"
                >
                  Create an account
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* SECURITY NOTE */}
              <div className="mt-7 flex items-start gap-3">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-[#9b7b40]"
                />

                <p className="text-xs leading-6 text-[#7b8c99]">
                  Sign in using your registered eBarangay Connect account. Your
                  available pages depend on your assigned account role.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e3e9ee] px-6 py-5 text-center text-xs text-[#8393a0]">
            2026 eBarangay Connect. All rights reserved.
          </div>
        </section>
      </div>
    </main>
  );
}
