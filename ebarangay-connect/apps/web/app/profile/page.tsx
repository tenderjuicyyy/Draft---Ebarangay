
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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

  // LOAD RESIDENT PROFILE
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (cancelled) return;

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

      if (cancelled) return;

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

  // SAVE PROFILE CHANGES
  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setSaving(false);
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        address: address.trim(),
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
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-6 font-sans">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#0b304b] text-white">
            <Loader2 size={28} className="animate-spin" />
          </div>

          <p className="mt-5 text-lg font-black text-[#0b304b]">
            Loading your profile
          </p>

          <p className="mt-2 text-sm text-[#697d8c]">
            Getting your resident information ready.
          </p>
        </div>
      </main>
    );
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
            eBarangay Connect
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
              <Landmark size={23} strokeWidth={1.7} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5bd81]">
                Digital Barangay Portal
              </p>

              <p className="mt-1 text-lg font-black tracking-tight sm:text-xl">
                eBarangay Connect
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b]"
          >
            <ArrowLeft size={16} />

            <span className="hidden sm:inline">
              Dashboard
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </Link>
        </div>
      </header>

      {/* PAGE HERO */}
      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{
            backgroundImage: "url('/barangay-hall.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-[#061b2b]/95 via-[#0b304b]/90 to-[#0b304b]/75" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#d5bd81]" />

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e2c991]">
              Resident Portal
            </p>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            My Profile
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
            Review and update your personal information
            used for your eBarangay Connect account.
          </p>

          <div className="mt-7 flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
            <ShieldCheck
              size={18}
              className="text-[#e2c991]"
            />
            Resident Account Information
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
        >
            
        </Link>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-7 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">
              Something went wrong
            </p>

            <p className="mt-2 wrap-break-word text-sm leading-7 text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div
            role="status"
            className="mb-7 flex items-start gap-3 border-l-4 border-[#357c60] bg-[#edf7f1] px-6 py-5"
          >
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0 text-[#357c60]"
            />

            <div>
              <p className="font-black text-[#245e48]">
                Changes Saved
              </p>

              <p className="mt-2 text-sm leading-7 text-[#376a55]">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {profile && (
          <div className="grid gap-7 lg:grid-cols-[0.68fr_1.32fr]">
            {/* LEFT COLUMN */}
            <aside className="space-y-6">
              {/* PROFILE SUMMARY */}
              <section className="bg-[#0b304b] p-7 text-white sm:p-8">
                <div className="flex h-20 w-20 items-center justify-center border-2 border-[#d5bd81] bg-white/10 text-[#e2c991]">
                  <UserRound size={35} />
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#e2c991]">
                  Your Account
                </p>

                <h2 className="mt-3 wrap-wrap-break-word text-2xl font-black">
                  {profile.full_name || "Resident"}
                </h2>

                <p className="mt-3 wrap-wrap-break-word text-sm leading-7 text-[#c7d7e3]">
                  {profile.email || "No email available"}
                </p>

                <div className="mt-7 border-t border-white/20 pt-7">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e2c991]">
                    Account Role
                  </p>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center bg-white/10 text-[#e2c991]">
                      <ShieldCheck size={21} />
                    </div>

                    <div>
                      <p className="font-black capitalize">
                        {profile.role || "resident"}
                      </p>

                      <p className="mt-1 text-xs text-[#c7d7e3]">
                        eBarangay Connect account
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* SECURITY INFORMATION */}
              <section className="border border-[#dce3e8] bg-white p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                    <LockKeyhole size={20} />
                  </div>

                  <div>
                    <p className="font-black text-[#0b304b]">
                      Account Security
                    </p>

                    <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                      Your email address and account role
                      cannot be changed from this profile page.
                    </p>
                  </div>
                </div>
              </section>
            </aside>

            {/* PROFILE FORM */}
            <form
              onSubmit={handleSave}
              className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-9"
            >
              <div className="border-b border-[#e3e9ee] pb-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                  Personal Information
                </p>

                <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                  Profile Details
                </h2>

                <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                  Keep your resident information accurate
                  and up to date.
                </p>
              </div>

              <div className="mt-8 space-y-7">
                {/* FULL NAME */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="flex items-center gap-2 text-sm font-black text-[#173149]"
                  >
                    <UserRound
                      size={17}
                      className="text-[#9b7b40]"
                    />
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    disabled={saving}
                    required
                    placeholder="Enter your full name"
                    className="mt-4 w-full border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm font-semibold text-[#173149] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm font-black text-[#173149]"
                  >
                    <Mail
                      size={17}
                      className="text-[#9b7b40]"
                    />
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={profile.email || ""}
                    disabled
                    className="mt-4 w-full cursor-not-allowed border border-[#dce3e8] bg-[#edf2f5] px-4 py-4 text-sm font-semibold text-[#718391]"
                  />

                  <p className="mt-2 flex items-center gap-2 text-xs text-[#8193a2]">
                    <LockKeyhole size={13} />
                    Your email is managed by your account.
                  </p>
                </div>

                {/* PHONE NUMBER */}
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="flex items-center gap-2 text-sm font-black text-[#173149]"
                  >
                    <Phone
                      size={17}
                      className="text-[#9b7b40]"
                    />
                    Phone Number
                  </label>

                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(event) =>
                      setPhoneNumber(event.target.value)
                    }
                    disabled={saving}
                    placeholder="Enter your phone number"
                    className="mt-4 w-full border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm font-semibold text-[#173149] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* ADDRESS */}
                <div>
                  <label
                    htmlFor="address"
                    className="flex items-center gap-2 text-sm font-black text-[#173149]"
                  >
                    <MapPin
                      size={17}
                      className="text-[#9b7b40]"
                    />
                    Address
                  </label>

                  <textarea
                    id="address"
                    value={address}
                    onChange={(event) =>
                      setAddress(event.target.value)
                    }
                    disabled={saving}
                    placeholder="Enter your address"
                    rows={4}
                    className="mt-4 w-full resize-none border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-[#173149] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {/* ACCOUNT ROLE */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-black text-[#173149]">
                    <ShieldCheck
                      size={17}
                      className="text-[#9b7b40]"
                    />
                    Account Role
                  </label>

                  <div className="mt-4 flex items-center justify-between border border-[#dce3e8] bg-[#edf2f5] px-4 py-4">
                    <span className="text-sm font-bold capitalize text-[#718391]">
                      {profile.role || "resident"}
                    </span>

                    <LockKeyhole
                      size={16}
                      className="text-[#98a9b5]"
                    />
                  </div>

                  <p className="mt-2 text-xs text-[#8193a2]">
                    Account roles are managed by the system.
                  </p>
                </div>
              </div>

              {/* FORM ACTIONS */}
              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-[#e3e9ee] pt-7 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 border border-[#cdd9e2] px-6 py-3.5 text-sm font-bold text-[#0b304b] transition hover:bg-[#edf2f5]"
                >
                  <ArrowLeft size={16} />
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 bg-[#0b304b] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Â© 2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </div>
      </footer>
    </main>
  );
}

