"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleUpdatePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 8) {
      setErrorMessage(
        "Your new password must be at least 8 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "The passwords do not match. Please try again."
      );
      return;
    }

    setLoading(true);

    try {


      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        const message = error.message.toLowerCase();

        if (
          message.includes("session") ||
          message.includes("token") ||
          message.includes("expired")
        ) {
          setErrorMessage(
            "Your password reset link may have expired or already been used. Return to login and request a new reset link."
          );
        } else {
          setErrorMessage(error.message);
        }

        return;
      }

      setPassword("");
      setConfirmPassword("");

      setSuccessMessage(
        "Your password has been updated successfully. You can now sign in with your new password."
      );


      window.setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch {
      setErrorMessage(
        "Something went wrong. Please try again or request a new reset link."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-4 py-10 font-sans text-[#172b3d]">
      <section className="w-full max-w-lg border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-10">

        <Link
          href="/login"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0b304b] transition hover:text-[#9b7b40]"
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>


        <div className="mt-8 flex h-14 w-14 items-center justify-center bg-[#0b304b] text-white">
          <KeyRound size={25} />
        </div>


        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b40]">
          Account recovery
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0b304b] sm:text-4xl">
          Create a new password
        </h1>

        <p className="mt-4 text-sm leading-7 text-[#697d8c]">
          Choose a new password for your eBarangay Connect
          account. Your password must contain at least
          8 characters.
        </p>


        {errorMessage && (
          <div
            role="alert"
            className="mt-6 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-4 py-3 text-sm leading-6 text-[#943d31]"
          >
            {errorMessage}
          </div>
        )}


        {successMessage && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>{successMessage}</span>
          </div>
        )}


        <form
          onSubmit={handleUpdatePassword}
          className="mt-7 space-y-5"
        >

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-bold text-[#173149]"
            >
              New password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8497a5]"
              />

              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="At least 8 characters"
                className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-12 text-sm outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                aria-label={
                  showPassword
                    ? "Hide new password"
                    : "Show new password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8497a5] transition hover:text-[#0b304b]"
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>


          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-bold text-[#173149]"
            >
              Confirm new password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8497a5]"
              />

              <input
                id="confirm-password"
                type={
                  showConfirmPassword ? "text" : "password"
                }
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Re-enter your new password"
                className="w-full border border-[#cdd9e2] bg-[#f8fafc] py-4 pl-12 pr-12 text-sm outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((value) => !value)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8497a5] transition hover:text-[#0b304b]"
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>


          <button
            type="submit"
            disabled={loading || Boolean(successMessage)}
            className="flex min-h-12 w-full items-center justify-center gap-3 bg-[#0b304b] px-5 py-4 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Updating password...
              </>
            ) : (
              <>
                Update password
                <KeyRound size={18} />
              </>
            )}
          </button>
        </form>


        <div className="mt-7 flex items-start gap-3 border-t border-[#e3e9ee] pt-5">
          <LockKeyhole
            size={18}
            className="mt-0.5 shrink-0 text-[#9b7b40]"
          />

          <p className="text-xs leading-6 text-[#7b8c99]">
            Only use a password reset link sent to your
            registered email. If the link expires, request a
            new one from the login page.
          </p>
        </div>
      </section>
    </main>
  );
}