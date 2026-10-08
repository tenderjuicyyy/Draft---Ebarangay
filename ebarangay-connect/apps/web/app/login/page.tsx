
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

  // Existing Supabase authentication logic preserved.
  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
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

      {/* LOGIN CONTENT */}
      <div className="mx-auto grid min-h-[calc(100vh-132px)] max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">
        {/* LEFT INFORMATION PANEL */}
        <section className="relative hidden overflow-hidden bg-[#102f48] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-75"
            style={{
              backgroundImage: "url('/barangay-hall.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-linear-to- from-[#0b304b]/95 via-[#0b304b]/80 to-[#061b2b]/95" />

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
              Access your resident dashboard to request barangay
              documents, monitor their progress, and manage your
              transactions online.
            </p>

            <div className="mt-12 space-y-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-[#e2c991]">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">
                    Manage document requests
                  </p>
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
                  <p className="text-sm font-bold">
                    Track request status
                  </p>
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
                  <p className="text-sm font-bold">
                    Secure resident access
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#c1d0dc]">
                    Your account keeps your requests organized.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-14 border-t border-white/20 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aebfcd]">
              eBarangay Connect â€¢ Digital Citizen Services
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

          <div className="flex flex-1 items-center justify-center px-6 py-14 sm:px-10 lg:px-14">
            <div className="w-full max-w-md">
              {/* HEADING */}
              <div className="mb-9">
                <div className="mb-6 flex h-14 w-14 items-center justify-center bg-[#0b304b] text-white">
                  <LockKeyhole size={24} />
                </div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b40]">
                  Resident Login
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0b304b] sm:text-4xl">
                  Sign in to your account
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#697d8c]">
                  Enter your registered email and password to access
                  your eBarangay Connect dashboard.
                </p>
              </div>

              {/* ERROR MESSAGE */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-5 py-4"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-[#943d31]">
                    Login failed
                  </p>
                  <p className="mt-2 text-sm text-[#943d31]">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* LOGIN FORM */}
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
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-4 text-sm text-[#172b3d] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-[#173149]"
                  >
                    Password
                  </label>

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
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-12 text-sm text-[#172b3d] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8497a5] transition hover:text-[#0b304b]"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
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
                  className="flex w-full items-center justify-center gap-3 bg-[#0b304b] px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
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
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

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
                  Sign in using the resident account you registered
                  with eBarangay Connect.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e3e9ee] px-6 py-5 text-center text-xs text-[#8393a0]">
            Â© 2026 eBarangay Connect. All rights reserved.
          </div>
        </section>
      </div>
    </main>
  );
}

