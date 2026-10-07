"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
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
      <main className="flex min-h-screen items-center justify-center bg-[#f4f0e4] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4d5435] text-[#f7f2e7]">
            <Loader2
              size={27}
              className="animate-spin"
            />
          </div>

          <p className="mt-5 text-lg font-black text-[#25281e]">
            Loading your profile
          </p>

          <p className="mt-1 text-sm text-[#777465]">
            Getting your resident information ready.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#77794f] px-3 py-3 text-[#25281e] sm:px-5 sm:py-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden rounded-4xl bg-[#f4f0e4] shadow-2xl sm:min-h-[calc(100vh-40px)]">
        {/* HEADER */}
        <header className="border-b border-[#dcd5c4] bg-[#f7f3e9]">
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#7b8058] text-[#59603d]">
                <Home size={20} />
              </div>

              <div>
                <p className="text-lg font-black leading-none tracking-tight text-[#24271d]">
                  eBarangay
                </p>

                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7b8058]">
                  Connect
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-[#d3ccba] px-4 py-2.5 text-sm font-bold text-[#555548] transition hover:bg-[#ebe5d7] sm:px-5"
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

        {/* CONTENT */}
        <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#696958] transition hover:text-[#b55f3b]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          {/* INTRO */}
          <section className="mt-6">
            <div className="flex w-fit items-center gap-2 rounded-full border border-[#d2cab6] bg-[#eee8da] px-4 py-2">
              <UserRound
                size={14}
                className="text-[#6c744d]"
              />

              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#65664e]">
                Resident Account
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-[#25271e] sm:text-5xl">
              My Profile
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#706f62] sm:text-base">
              Review and update your personal information
              used for your eBarangay Connect account.
            </p>
          </section>

          {/* MESSAGES */}
          {errorMessage && (
            <div className="mt-6 rounded-3xl border border-[#dfb9aa] bg-[#f7e5de] p-5">
              <p className="font-black text-[#8d4938]">
                Something went wrong
              </p>

              <p className="mt-1 wrap-break-word text-sm leading-6 text-[#9b5a49]">
                {errorMessage}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 flex items-start gap-3 rounded-3xl border border-[#bdc9ae] bg-[#e5ecdc] p-5">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-[#53663e]"
              />

              <div>
                <p className="font-black text-[#435332]">
                  Changes saved
                </p>

                <p className="mt-1 text-sm text-[#5f704d]">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {profile && (
            <div className="mt-7 grid gap-6 lg:grid-cols-[0.68fr_1.32fr]">
              {/* PROFILE SUMMARY */}
              <aside className="space-y-5">
                <section className="overflow-hidden rounded-4xl bg-[#4d5435] p-7 text-[#f7f2e7]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f2ecdf] text-[#505738]">
                    <UserRound size={34} />
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#d1d3ba]">
                    Your Account
                  </p>

                  <h2 className="mt-2 wrap-break-word text-2xl font-black">
                    {profile.full_name || "Resident"}
                  </h2>

                  <p className="mt-2 wrap-break-word text-sm text-[#d4d5c5]">
                    {profile.email ||
                      "No email available"}
                  </p>

                  <div className="mt-7 border-t border-white/15 pt-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#bfc2a8]">
                      Account Role
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#69704a]">
                        <ShieldCheck size={18} />
                      </div>

                      <div>
                        <p className="font-black capitalize">
                          {profile.role || "resident"}
                        </p>

                        <p className="mt-0.5 text-xs text-[#d4d5c5]">
                          eBarangay Connect account
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-[#dcd5c4] bg-[#f8f4ea] p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e6e8d8] text-[#5b6442]">
                      <LockKeyhole size={18} />
                    </div>

                    <div>
                      <p className="font-black text-[#303328]">
                        Account security
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#706f62]">
                        Your email address and account role
                        cannot be changed from this profile
                        page.
                      </p>
                    </div>
                  </div>
                </section>
              </aside>

              {/* FORM */}
              <form
                onSubmit={handleSave}
                className="rounded-4xl border border-[#dcd5c4] bg-[#f8f4ea] p-6 sm:p-8"
              >
                <div className="border-b border-[#ded7c6] pb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8058]">
                    Personal Information
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-[#292c21]">
                    Profile details
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#777465]">
                    Keep your resident information accurate
                    and up to date.
                  </p>
                </div>

                <div className="mt-7 space-y-6">
                  {/* FULL NAME */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="flex items-center gap-2 text-sm font-black text-[#34372b]"
                    >
                      <UserRound
                        size={16}
                        className="text-[#747b51]"
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
                      className="mt-3 w-full rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm font-semibold text-[#34372b] outline-none transition placeholder:text-[#aaa697] focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label
                      htmlFor="email"
                      className="flex items-center gap-2 text-sm font-black text-[#34372b]"
                    >
                      <Mail
                        size={16}
                        className="text-[#747b51]"
                      />
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={profile.email || ""}
                      disabled
                      className="mt-3 w-full cursor-not-allowed rounded-2xl border border-[#d8d2c3] bg-[#ece8dd] px-4 py-3.5 text-sm font-semibold text-[#8a8778]"
                    />

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#8a8778]">
                      <LockKeyhole size={12} />
                      Your email is managed by your account.
                    </p>
                  </div>

                  {/* PHONE */}
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="flex items-center gap-2 text-sm font-black text-[#34372b]"
                    >
                      <Phone
                        size={16}
                        className="text-[#747b51]"
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
                      className="mt-3 w-full rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm font-semibold text-[#34372b] outline-none transition placeholder:text-[#aaa697] focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <label
                      htmlFor="address"
                      className="flex items-center gap-2 text-sm font-black text-[#34372b]"
                    >
                      <MapPin
                        size={16}
                        className="text-[#747b51]"
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
                      className="mt-3 w-full resize-none rounded-2xl border border-[#d5cebc] bg-[#fffdf7] px-4 py-3.5 text-sm leading-6 text-[#34372b] outline-none transition placeholder:text-[#aaa697] focus:border-[#777f55] focus:ring-2 focus:ring-[#777f55]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  {/* ROLE */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-black text-[#34372b]">
                      <ShieldCheck
                        size={16}
                        className="text-[#747b51]"
                      />
                      Account Role
                    </label>

                    <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#d8d2c3] bg-[#ece8dd] px-4 py-3.5">
                      <span className="text-sm font-bold capitalize text-[#666658]">
                        {profile.role || "resident"}
                      </span>

                      <LockKeyhole
                        size={15}
                        className="text-[#9b9788]"
                      />
                    </div>

                    <p className="mt-2 text-xs text-[#8a8778]">
                      Account roles are managed by the
                      system.
                    </p>
                  </div>
                </div>

                {/* SAVE */}
                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#ded7c6] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d1c9b7] px-5 py-3 text-sm font-bold text-[#646455] transition hover:bg-[#eee8da]"
                  >
                    <ArrowLeft size={16} />
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c96f46] px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#b8613d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
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
        <footer className="mt-8 border-t border-[#d9d2c1] bg-[#f7f3e9] px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-2 text-xs text-[#858273] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 eBarangay Connect</p>
            <p>
              Digital barangay services for residents.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}