
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
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
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setErrorMessage("");
    setSuccessMessage("");

    const cleanedName = fullName.trim();
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!cleanedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage(
        "Please accept the Terms and Conditions before registering."
      );
      return;
    }

    setLoading(true);

    try {
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
        const message = error.message.toLowerCase();

        if (
          error.code === "user_already_exists" ||
          error.code === "email_exists" ||
          message.includes("already registered") ||
          message.includes("already exists")
        ) {
          setSuccessMessage(
            "If this email address is eligible for registration, you will receive a verification email. If you already have an account, please sign in or reset your password."
          );
          return;
        }

        if (
          message.includes("rate limit") ||
          message.includes("too many requests")
        ) {
          setErrorMessage(
            "Too many registration attempts. Please wait before trying again."
          );
          return;
        }

        setErrorMessage(error.message);
        return;
      }

      if (!data.user) {
        setErrorMessage(
          "Unable to process your registration. Please try again."
        );
        return;
      }

      // Supabase can return an obscured user object for
      // an email that is already registered.
      // Do not claim a new account was created based
      // solely on data.user.
      if (data.session) {
        setSuccessMessage(
          "Your registration request was processed. If you are signed in, you can continue to your dashboard. Otherwise, check your email or sign in."
        );
      } else {
        setSuccessMessage(
          "Registration request received. If this email is eligible for a new account, a verification message will be sent. If you already registered, please sign in or use Forgot Password."
        );
      }

      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage(
        "Something went wrong. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-12 text-sm text-[#172b3d] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:opacity-60";

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#c7d7e3]">
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
              <Landmark size={23} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#d5bd81]">
                Digital Barangay Portal
              </p>
              <p className="mt-1 text-lg font-black sm:text-xl">
                eBarangay Connect
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="hidden items-center gap-2 border border-white/30 px-4 py-2.5 text-xs font-bold transition hover:bg-white hover:text-[#0b304b] sm:inline-flex"
          >
            <ArrowLeft size={15} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto grid min-h-[calc(100vh-132px)] max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">
        {/* LEFT PANEL */}
        <section className="relative hidden overflow-hidden bg-[#102f48] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between xl:px-14">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-75"
            style={{
              backgroundImage: "url('/barangay-hall.jpg')",
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-[#0b304b]/95 via-[#0b304b]/80 to-[#061b2b]/95" />

          <div className="relative z-10">
            <div className="mb-8 h-1 w-14 bg-[#d5bd81]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#e2c991]">
              Resident Registration
            </p>

            <h1 className="mt-7 text-5xl font-black leading-tight xl:text-6xl">
              Your barangay
              <br />
              services,
              <br />
              online.
            </h1>

            <p className="mt-7 max-w-md text-sm leading-8 text-[#d6e1e9]">
              Create your resident account to request barangay
              documents, monitor their progress, and manage
              your transactions through eBarangay Connect.
            </p>

            <div className="mt-12 space-y-7">
              {[
                {
                  icon: FileText,
                  title: "Request documents online",
                  description:
                    "Submit barangay requests from your account.",
                },
                {
                  icon: CheckCircle2,
                  title: "Track your requests",
                  description:
                    "Monitor request status from your dashboard.",
                },
                {
                  icon: ShieldCheck,
                  title: "Personal resident account",
                  description:
                    "Your requests stay connected to your account.",
                },
              ].map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-[#e2c991]">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        {feature.title}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-[#c1d0dc]">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 mt-14 border-t border-white/20 pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#aebfcd]">
              eBarangay Connect • Digital Citizen Services
            </p>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="flex min-w-0 flex-col bg-white">
          <div className="px-6 pt-7 sm:px-10 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b304b]"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>

          <div className="flex flex-1 justify-center px-6 py-12 sm:px-10 lg:px-14">
            <div className="w-full max-w-lg">
              <div className="mb-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center bg-[#0b304b] text-white">
                  <UserRound size={24} />
                </div>

                <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                  Create Account
                </p>

                <h2 className="mt-3 text-3xl font-black text-[#0b304b] sm:text-4xl">
                  Create resident account
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#697d8c]">
                  Register to submit and track your barangay
                  document requests online.
                </p>
              </div>

              {/* ERROR */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-6 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-5 py-4"
                >
                  <p className="text-xs font-black uppercase text-[#943d31]">
                    Registration issue
                  </p>
                  <p className="mt-2 text-sm text-[#943d31]">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* SUCCESS / NEUTRAL RESULT */}
              {successMessage && (
                <div
                  role="status"
                  className="mb-6 border-l-4 border-[#357c60] bg-[#edf7f1] px-5 py-4"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-[#357c60]"
                    />
                    <div>
                      <p className="text-xs font-black uppercase text-[#245e48]">
                        Registration request processed
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#376a55]">
                        {successMessage}
                      </p>

                      <Link
                        href="/login"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#245e48]"
                      >
                        Go to Login
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleRegister}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-bold text-[#173149]"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <UserRound
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8497a5]"
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
                      className={inputClass}
                    />
                  </div>
                </div>

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
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
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
                        type={
                          showPassword ? "text" : "password"
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
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8497a5]"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-bold text-[#173149]"
                    >
                      Confirm password
                    </label>
                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8497a5]"
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
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8497a5]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-[#edf2f5] px-4 py-4">
                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[#9b7b40]"
                  />
                  <p className="text-xs leading-6 text-[#697d8c]">
                    Your password must contain at least 8
                    characters. Email verification may be
                    required before signing in.
                  </p>
                </div>

                {/* TERMS */}
                <div className="border border-[#dce3e8] bg-[#f8fafc] p-4">
                  <div className="flex items-start gap-3">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(event) =>
                        setAgreedToTerms(
                          event.target.checked
                        )
                      }
                      disabled={loading}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#0b304b]"
                    />

                    <div className="text-sm leading-6 text-[#697d8c]">
                      <label htmlFor="agreeTerms">
                        I have read and agree to the{" "}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="font-bold text-[#0b304b] underline underline-offset-2"
                      >
                        Terms and Conditions &amp; Privacy Policy
                      </button>
                      .
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className="flex w-full items-center justify-center gap-3 bg-[#0b304b] px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Processing registration...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 border border-[#dce3e8] bg-[#f5f8fa] p-6 text-center">
                <p className="text-sm text-[#697d8c]">
                  Already have a resident account?
                </p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-black text-[#0b304b]"
                >
                  Sign in to your account
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          <footer className="border-t border-[#e3e9ee] px-6 py-5 text-center text-xs text-[#8393a0]">
            © 2026 eBarangay Connect. All rights reserved.
          </footer>
        </section>
      </div>

      {/* TERMS AND CONDITIONS MODAL */}
      {showTerms && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#061b2b]/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowTerms(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-[#0b304b] px-5 py-5 text-white sm:px-7">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={25}
                  className="text-[#d5bd81]"
                />
                <div>
                  <h2
                    id="terms-title"
                    className="text-lg font-black"
                  >
                    Terms and Conditions
                  </h2>
                  <p className="text-xs text-[#c7d7e3]">
                    Privacy Policy • eBarangay Connect
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTerms(false)}
                aria-label="Close terms and conditions"
                className="rounded p-2 hover:bg-white/10"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-6 text-sm leading-7 text-[#526879] sm:px-7">
              <p>
                By registering for eBarangay Connect, you
                acknowledge and agree to the following:
              </p>

              <div>
                <h3 className="font-bold text-[#0b304b]">
                  1. Personal Information
                </h3>
                <p>
                  We collect your name, email address,
                  contact number, address, identification
                  documents, and request details when
                  required to provide barangay services.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0b304b]">
                  2. Use of Information
                </h3>
                <p>
                  Your information will be used for account
                  verification, document processing, request
                  tracking, and communication regarding
                  barangay services.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0b304b]">
                  3. Data Privacy
                </h3>
                <p>
                  In accordance with the Data Privacy Act
                  of 2012 (RA 10173), we are committed to
                  protecting your personal information and
                  limiting access to authorized personnel.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0b304b]">
                  4. Data Storage and Security
                </h3>
                <p>
                  Your information will be stored using
                  appropriate security measures and retained
                  only as necessary for legitimate purposes
                  and legal requirements.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0b304b]">
                  5. User Responsibilities
                </h3>
                <p>
                  You agree to provide accurate information,
                  protect your account credentials, and use
                  the platform responsibly.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0b304b]">
                  6. Your Privacy Rights
                </h3>
                <p>
                  You may request access to or correction of
                  your personal information and exercise
                  other rights under applicable data privacy
                  laws.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#0b304b]">
                  7. Agreement
                </h3>
                <p>
                  By clicking &quot;I Agree,&quot; you confirm
                  that you have read and understood these
                  Terms and Conditions and Privacy Policy.
                </p>
              </div>

              <p className="border-t border-[#dce3e8] pt-4 text-xs text-[#697d8c]">
                This notice explains the intended handling
                of resident information. Specific privacy
                requests should be directed to the barangay
                administration.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#e3e9ee] bg-[#f8fafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={() => setShowTerms(false)}
                className="border border-[#cdd9e2] px-5 py-3 text-sm font-bold text-[#526879]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTerms(false);
                  setErrorMessage("");
                }}
                className="flex items-center justify-center gap-2 bg-[#0b304b] px-6 py-3 text-sm font-bold text-white"
              >
                <CheckCircle2 size={18} />
                I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
