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
  Home,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <main className="min-h-screen bg-[#77794f] p-3 text-[#292c21] sm:p-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-[28px] bg-[#f4f0e4] shadow-2xl sm:min-h-[calc(100vh-40px)] sm:rounded-[36px]">
        <div className="grid min-h-[calc(100vh-24px)] lg:grid-cols-[0.92fr_1.08fr] sm:min-h-[calc(100vh-40px)]">

          {/* LEFT SIDE */}
          <section className="relative hidden overflow-hidden bg-[#4d5435] p-10 text-[#f7f2e7] lg:flex lg:flex-col lg:justify-between xl:p-12">
            {/* Decorative shapes */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-45 border-[#606846]" />

            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#59613f]" />

            <div className="absolute bottom-28 right-10 h-28 w-28 rounded-full border-20 border-[#626a45]" />

            {/* Logo */}
            <Link
              href="/"
              className="relative z-10 flex w-fit items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#afb395] text-[#f7f2e7]">
                <Home size={20} />
              </div>

              <div>
                <p className="text-lg font-black leading-none">
                  eBarangay
                </p>

                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#cdd0b4]">
                  Connect
                </p>
              </div>
            </Link>

            {/* Main message */}
            <div className="relative z-10 max-w-lg py-12">
              <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#d49a70]" />

                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d8dac4]">
                  Resident Registration
                </span>
              </div>

              <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.04em] xl:text-6xl">
                Your barangay
                <br />
                services,
                <br />
                online.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-6 text-[#d6d7c6]">
                Create your resident account to request barangay
                documents, monitor their progress, and manage your
                transactions through eBarangay Connect.
              </p>

              <div className="mt-9 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#626a45]">
                    <FileText size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Request documents online
                    </p>

                    <p className="text-xs text-[#c6c8b4]">
                      Submit barangay requests from your account.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#626a45]">
                    <CheckCircle2 size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Track your requests
                    </p>

                    <p className="text-xs text-[#c6c8b4]">
                      Monitor request status from your dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#626a45]">
                    <ShieldCheck size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Personal resident account
                    </p>

                    <p className="text-xs text-[#c6c8b4]">
                      Your requests stay connected to your account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#aeb19b]">
              Digital Citizen Services Portal
            </p>
          </section>

          {/* RIGHT SIDE */}
          <section className="flex min-h-full flex-col bg-[#f4f0e4]">
            {/* Top navigation */}
            <div className="flex items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#676858] transition hover:text-[#c96f46]"
              >
                <ArrowLeft size={16} />
                Back to home
              </Link>

              <Link
                href="/"
                className="flex items-center gap-2 lg:hidden"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7b8058] text-[#59603d]">
                  <Home size={17} />
                </div>

                <span className="hidden text-sm font-black sm:block">
                  eBarangay Connect
                </span>
              </Link>
            </div>

            {/* Registration form */}
            <div className="flex flex-1 justify-center px-6 pb-10 sm:px-10 lg:px-12">
              <div className="w-full max-w-lg py-4 lg:py-6">
                <div className="mb-7">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#505738] text-[#f7f2e7]">
                    <UserRound size={21} />
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                    Create Account
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#292c21] sm:text-4xl">
                    Create resident account
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#777465]">
                    Register to submit and track your barangay
                    document requests online.
                  </p>
                </div>

                {/* ERROR */}
                {errorMessage && (
                  <div className="mb-5 rounded-[18px] border border-[#dfb9aa] bg-[#f7e5de] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-[#8d4938]">
                      Registration failed
                    </p>

                    <p className="mt-1 text-sm text-[#9b5a49]">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {/* SUCCESS */}
                {successMessage && (
                  <div className="mb-5 rounded-[18px] border border-[#bdcbaa] bg-[#e6eddc] p-4">
                    <div className="flex gap-3">
                      <CheckCircle2
                        size={19}
                        className="mt-0.5 shrink-0 text-[#5e7048]"
                      />

                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-[#52633e]">
                          Account created
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[#647153]">
                          {successMessage}
                        </p>

                        <Link
                          href="/login"
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-[#52633e] transition hover:text-[#3f4d30]"
                        >
                          Go to Login
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleRegister}
                  className="space-y-5"
                >
                  {/* FULL NAME */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-bold text-[#4d5040]"
                    >
                      Full name
                    </label>

                    <div className="relative">
                      <UserRound
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#999582]"
                      />

                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        placeholder="Juan Dela Cruz"
                        disabled={loading}
                        className="w-full rounded-2xl border border-[#d5cebc] bg-[#faf7ef] py-3.5 pl-12 pr-4 text-sm text-[#292c21] outline-none transition placeholder:text-[#aaa694] focus:border-[#7b8058] focus:bg-white focus:ring-2 focus:ring-[#7b8058]/10 disabled:cursor-not-allowed disabled:bg-[#ebe7dc] disabled:opacity-70"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-bold text-[#4d5040]"
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#999582]"
                      />

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="you@example.com"
                        disabled={loading}
                        className="w-full rounded-2xl border border-[#d5cebc] bg-[#faf7ef] py-3.5 pl-12 pr-4 text-sm text-[#292c21] outline-none transition placeholder:text-[#aaa694] focus:border-[#7b8058] focus:bg-white focus:ring-2 focus:ring-[#7b8058]/10 disabled:cursor-not-allowed disabled:bg-[#ebe7dc] disabled:opacity-70"
                      />
                    </div>
                  </div>

                  {/* PASSWORDS */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-bold text-[#4d5040]"
                      >
                        Password
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#999582]"
                        />

                        <input
                          id="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          placeholder="At least 8 characters"
                          disabled={loading}
                          className="w-full rounded-2xl border border-[#d5cebc] bg-[#faf7ef] py-3.5 pl-12 pr-11 text-sm text-[#292c21] outline-none transition placeholder:text-[#aaa694] focus:border-[#7b8058] focus:bg-white focus:ring-2 focus:ring-[#7b8058]/10 disabled:cursor-not-allowed disabled:bg-[#ebe7dc] disabled:opacity-70"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (current) => !current
                            )
                          }
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8978] transition hover:text-[#4d5435] disabled:opacity-50"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-bold text-[#4d5040]"
                      >
                        Confirm password
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          size={18}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#999582]"
                        />

                        <input
                          id="confirmPassword"
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(
                              event.target.value
                            )
                          }
                          placeholder="Re-enter password"
                          disabled={loading}
                          className="w-full rounded-2xl border border-[#d5cebc] bg-[#faf7ef] py-3.5 pl-12 pr-11 text-sm text-[#292c21] outline-none transition placeholder:text-[#aaa694] focus:border-[#7b8058] focus:bg-white focus:ring-2 focus:ring-[#7b8058]/10 disabled:cursor-not-allowed disabled:bg-[#ebe7dc] disabled:opacity-70"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (current) => !current
                            )
                          }
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8978] transition hover:text-[#4d5435] disabled:opacity-50"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-2xl bg-[#ebe5d7] px-4 py-3">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-[#737a52]"
                    />

                    <p className="text-xs leading-5 text-[#747265]">
                      Your password must contain at least 8
                      characters. You may also need to verify your
                      email before signing in.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c96f46] px-5 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-[#b8613d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                {/* LOGIN LINK */}
                <div className="mt-7 rounded-[20px] border border-[#ddd6c5] bg-[#ebe5d7] p-5 text-center">
                  <p className="text-sm text-[#6f6d5f]">
                    Already have a resident account?
                  </p>

                  <Link
                    href="/login"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-[#b75f3b] transition hover:text-[#944a2e]"
                  >
                    Sign in to your account
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}