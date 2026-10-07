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

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#77794f] p-3 text-[#292c21] sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-[28px] bg-[#f4f0e4] shadow-2xl sm:min-h-[calc(100vh-40px)] sm:rounded-[36px]">

        <div className="grid w-full lg:grid-cols-[0.95fr_1.05fr]">

          {/* LEFT SIDE */}
          <section className="relative hidden overflow-hidden bg-[#4d5435] p-10 text-[#f7f2e7] lg:flex lg:flex-col lg:justify-between xl:p-12">

            {/* Decorative circles */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-45 border-[#606846]" />

            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#59613f]" />

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
                  Resident Portal
                </span>
              </div>

              <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.04em] xl:text-6xl">
                Welcome
                <br />
                back.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-6 text-[#d6d7c6]">
                Access your resident dashboard to request barangay
                documents, monitor their progress, and manage your
                transactions online.
              </p>

              <div className="mt-9 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#626a45]">
                    <FileText size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Manage document requests
                    </p>

                    <p className="text-xs text-[#c6c8b4]">
                      Access all your barangay requests.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#626a45]">
                    <CheckCircle2 size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Track request status
                    </p>

                    <p className="text-xs text-[#c6c8b4]">
                      See pending, processing, and completed requests.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#626a45]">
                    <ShieldCheck size={16} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Secure resident access
                    </p>

                    <p className="text-xs text-[#c6c8b4]">
                      Your account keeps your requests organized.
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

            {/* Top */}
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

            {/* Form area */}
            <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10 lg:px-12">
              <div className="w-full max-w-md">

                <div className="mb-8">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#505738] text-[#f7f2e7]">
                    <LockKeyhole size={21} />
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                    Resident Login
                  </p>

                  <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-[#292c21] sm:text-4xl">
                    Sign in to your account
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-[#777465]">
                    Enter your registered email and password to access
                    your eBarangay Connect dashboard.
                  </p>
                </div>

                {/* Error */}
                {errorMessage && (
                  <div className="mb-5 rounded-[18px] border border-[#dfb9aa] bg-[#f7e5de] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-[#8d4938]">
                      Login failed
                    </p>

                    <p className="mt-1 text-sm text-[#9b5a49]">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
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
                        className="w-full rounded-2xl border border-[#d5cebc] bg-[#faf7ef] py-3.5 pl-12 pr-4 text-sm text-[#292c21] outline-none transition placeholder:text-[#aaa694] focus:border-[#7b8058] focus:bg-white focus:ring-2 focus:ring-[#7b8058]/10"
                      />
                    </div>
                  </div>

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
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="Enter your password"
                        className="w-full rounded-2xl border border-[#d5cebc] bg-[#faf7ef] py-3.5 pl-12 pr-12 text-sm text-[#292c21] outline-none transition placeholder:text-[#aaa694] focus:border-[#7b8058] focus:bg-white focus:ring-2 focus:ring-[#7b8058]/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d8978] transition hover:text-[#4d5435]"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
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
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                {/* Create account */}
                <div className="mt-7 rounded-[20px] border border-[#ddd6c5] bg-[#ebe5d7] p-5 text-center">
                  <p className="text-sm text-[#6f6d5f]">
                    Don&apos;t have a resident account?
                  </p>

                  <Link
                    href="/register"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-[#b75f3b] transition hover:text-[#944a2e]"
                  >
                    Create an account
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Security */}
                <div className="mt-6 flex items-start gap-3">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-[#7b8058]"
                  />

                  <p className="text-xs leading-5 text-[#858273]">
                    Sign in using the resident account you registered
                    with eBarangay Connect.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}