
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
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
  Upload,
  Pencil,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  role: string | null;
  avatar_url: string | null;
};

const BUCKET = "avatars";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(
    null
  );

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");

  // NEW: Edit mode
  const [isEditing, setIsEditing] = useState(false);

  const [avatarSrc, setAvatarSrc] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // LOAD PROFILE
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone_number, address, role, avatar_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setErrorMessage(
          error?.message || "Profile not found."
        );
        setLoading(false);
        return;
      }

      const loadedProfile = data as Profile;

      setProfile(loadedProfile);
      setFullName(loadedProfile.full_name || "");
      setPhoneNumber(loadedProfile.phone_number || "");
      setAddress(loadedProfile.address || "");

      if (loadedProfile.avatar_url) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from(BUCKET)
            .createSignedUrl(
              loadedProfile.avatar_url,
              60 * 60
            );

        if (!cancelled) {
          if (signedError) {
            console.error(signedError);
          } else {
            setAvatarSrc(signedData?.signedUrl || "");
          }
        }
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // CLEAN UP IMAGE PREVIEW
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // NEW: ENABLE EDITING
  function handleEditProfile() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsEditing(true);
  }

  // NEW: CANCEL EDITING
  function handleCancelEditing() {
    if (!profile) return;

    setFullName(profile.full_name || "");
    setPhoneNumber(profile.phone_number || "");
    setAddress(profile.address || "");

    setIsEditing(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  // SELECT PROFILE PICTURE
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage(
        "Please select a JPG, PNG, or WebP image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        "The image must be 2 MB or smaller."
      );
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function cancelSelectedPhoto() {
    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // UPLOAD PROFILE PICTURE
  async function uploadProfilePicture() {
    if (!selectedFile || !profile || uploading) return;

    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    let uploadedPath = "";

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      if (user.id !== profile.id) {
        throw new Error("Account verification failed.");
      }

      const extension =
        selectedFile.type === "image/png"
          ? "png"
          : selectedFile.type === "image/webp"
            ? "webp"
            : "jpg";

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from(BUCKET)
          .upload(filePath, selectedFile, {
            contentType: selectedFile.type,
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPath = filePath;

      const previousPath = profile.avatar_url;

      const { data: updatedProfile, error: updateError } =
        await supabase
          .from("profiles")
          .update({ avatar_url: filePath })
          .eq("id", user.id)
          .select(
            "id, full_name, email, phone_number, address, role, avatar_url"
          )
          .single();

      if (updateError) {
        throw updateError;
      }

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from(BUCKET)
          .createSignedUrl(filePath, 60 * 60);

      if (signedError) {
        console.warn(
          "Photo saved, but signed URL failed:",
          signedError
        );
      }

      setProfile(updatedProfile as Profile);
      setAvatarSrc(signedData?.signedUrl || "");
      cancelSelectedPhoto();

      setSuccessMessage(
        "Profile picture uploaded and saved successfully!"
      );

      if (
        previousPath &&
        previousPath !== filePath &&
        previousPath.startsWith(`${user.id}/`)
      ) {
        const { error: removeError } =
          await supabase.storage
            .from(BUCKET)
            .remove([previousPath]);

        if (removeError) {
          console.warn(
            "Previous avatar cleanup failed:",
            removeError
          );
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to upload profile picture.";

      setErrorMessage(message);

      if (uploadedPath) {
        const { data } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", profile.id)
          .maybeSingle();

        if (data?.avatar_url !== uploadedPath) {
          await supabase.storage
            .from(BUCKET)
            .remove([uploadedPath]);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  // SAVE PERSONAL INFORMATION
  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile || !isEditing) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      if (!fullName.trim()) {
        setErrorMessage("Full name is required.");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          address: address.trim(),
        })
        .eq("id", user.id)
        .select(
          "id, full_name, email, phone_number, address, role, avatar_url"
        )
        .single();

      if (error) {
        throw error;
      }

      setProfile(data as Profile);
      setFullName(data.full_name || "");
      setPhoneNumber(data.phone_number || "");
      setAddress(data.address || "");

      // NEW: Lock fields after successful save
      setIsEditing(false);

      setSuccessMessage(
        "Profile information updated successfully."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-6">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-[#0b304b]"
          />
          <p className="mt-5 font-black text-[#0b304b]">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
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
              <Landmark size={23} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5bd81]">
                Digital Barangay Portal
              </p>
              <p className="mt-1 text-lg font-black sm:text-xl">
                eBarangay Connect
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase transition hover:bg-white hover:text-[#0b304b]"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
        </div>
      </header>

      {/* HERO */}
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

          <h1 className="mt-6 text-4xl font-black sm:text-5xl">
            My Profile
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
            Manage your account information and profile
            picture for eBarangay Connect.
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
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] hover:text-[#9b7b40]"
        >
          
        </Link>

        {errorMessage && (
          <div
            role="alert"
            className="mb-7 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">
              Something went wrong
            </p>
            <p className="mt-2 wrap-break-word text-sm text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-7 flex items-start gap-3 border-l-4 border-[#357c60] bg-[#edf7f1] px-6 py-5"
          >
            <CheckCircle2
              size={22}
              className="text-[#357c60]"
            />
            <div>
              <p className="font-black text-[#245e48]">
                Changes Saved
              </p>
              <p className="mt-2 text-sm text-[#376a55]">
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
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[#d5bd81] bg-white/10">
                  {previewUrl || avatarSrc ? (
                    <img
                      src={previewUrl || avatarSrc}
                      alt="Your profile picture"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#e2c991]">
                      <UserRound size={39} />
                    </div>
                  )}
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#e2c991]">
                  Your Account
                </p>

                <h2 className="mt-3 wrap-break-word text-2xl font-black">
                  {profile.full_name || "Resident"}
                </h2>

                <p className="mt-3 wrap-break-word text-sm leading-7 text-[#c7d7e3]">
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

              {/* PHOTO UPLOAD */}
              <section className="border border-[#dce3e8] bg-white p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-[#0b304b]">
                      Profile Picture
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#697d8c]">
                      Upload or replace your profile photo.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[#d5bd81] bg-[#e8eef3]">
                    {previewUrl || avatarSrc ? (
                      <img
                        src={previewUrl || avatarSrc}
                        alt="Profile picture preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound
                        size={54}
                        className="text-[#0b304b]"
                      />
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploading}
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={uploading}
                  className="mt-6 flex w-full items-center justify-center gap-2 border border-[#0b304b] px-5 py-3.5 text-sm font-black text-[#0b304b] transition hover:bg-[#edf2f5] disabled:opacity-50"
                >
                  <Camera size={17} />
                  Choose Profile Picture
                </button>

                <p className="mt-3 text-center text-xs leading-6 text-[#8193a2]">
                  JPG, PNG, or WebP · Maximum 2 MB
                </p>

                {selectedFile && (
                  <div className="mt-6 border-t border-[#e3e9ee] pt-5">
                    <p className="break-all text-xs font-semibold text-[#697d8c]">
                      Selected: {selectedFile.name}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void uploadProfilePicture()
                      }
                      disabled={uploading}
                      className="mt-4 flex w-full items-center justify-center gap-2 bg-[#0b304b] px-5 py-4 text-sm font-black text-white transition hover:bg-[#174b70] disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={17} />
                          Save Profile Picture
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={cancelSelectedPhoto}
                      disabled={uploading}
                      className="mt-3 w-full px-5 py-3 text-sm font-bold text-[#697d8c] hover:text-[#0b304b] disabled:opacity-50"
                    >
                      Cancel Selection
                    </button>
                  </div>
                )}
              </section>

              {/* ACCOUNT SECURITY */}
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
                      cannot be changed from this profile
                      page.
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
              <div className="flex flex-col justify-between gap-5 border-b border-[#e3e9ee] pb-7 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                    Personal Information
                  </p>

                  <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                    Profile Details
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                    {isEditing
                      ? "You can now edit your personal information."
                      : "Click Edit Profile to update your information."}
                  </p>
                </div>

                {/* NEW: EDIT PROFILE BUTTON */}
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleEditProfile}
                    disabled={uploading}
                    className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#0b304b] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70] disabled:opacity-50"
                  >
                    <Pencil size={17} />
                    Edit Profile
                  </button>
                )}

                {isEditing && (
                  <span className="inline-flex shrink-0 items-center gap-2 border border-[#d5bd81] bg-[#fffaf0] px-4 py-3 text-xs font-black text-[#8e6b25]">
                    <Pencil size={15} />
                    Editing Mode
                  </span>
                )}
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
                    disabled={!isEditing || saving}
                    required
                    placeholder="Enter your full name"
                    className={`mt-4 w-full border px-4 py-4 text-sm font-semibold outline-none transition ${
                      isEditing
                        ? "border-[#cdd9e2] bg-[#f8fafc] text-[#173149] focus:border-[#0b304b] focus:ring-2 focus:ring-[#0b304b]/10"
                        : "cursor-not-allowed border-[#dce3e8] bg-[#edf2f5] text-[#718391]"
                    }`}
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
                    disabled={!isEditing || saving}
                    placeholder="Enter your phone number"
                    className={`mt-4 w-full border px-4 py-4 text-sm font-semibold outline-none transition ${
                      isEditing
                        ? "border-[#cdd9e2] bg-[#f8fafc] text-[#173149] focus:border-[#0b304b] focus:ring-2 focus:ring-[#0b304b]/10"
                        : "cursor-not-allowed border-[#dce3e8] bg-[#edf2f5] text-[#718391]"
                    }`}
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
                    disabled={!isEditing || saving}
                    placeholder="Enter your address"
                    rows={4}
                    className={`mt-4 w-full resize-none border px-4 py-4 text-sm leading-7 outline-none transition ${
                      isEditing
                        ? "border-[#cdd9e2] bg-[#f8fafc] text-[#173149] focus:border-[#0b304b] focus:ring-2 focus:ring-[#0b304b]/10"
                        : "cursor-not-allowed border-[#dce3e8] bg-[#edf2f5] text-[#718391]"
                    }`}
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

              {/* NEW: SHOW ACTIONS ONLY WHILE EDITING */}
              {isEditing && (
                <div className="mt-9 flex flex-col-reverse gap-3 border-t border-[#e3e9ee] pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 border border-[#cdd9e2] px-6 py-3.5 text-sm font-bold text-[#0b304b] transition hover:bg-[#edf2f5] disabled:opacity-50"
                  >
                    <X size={17} />
                    Cancel Editing
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="inline-flex items-center justify-center gap-2 bg-[#0b304b] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70] disabled:opacity-60"
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
              )}

              {!isEditing && (
                <div className="mt-9 flex items-center gap-3 border-t border-[#e3e9ee] pt-7 text-sm text-[#697d8c]">
                  <LockKeyhole
                    size={17}
                    className="shrink-0 text-[#9b7b40]"
                  />
                  Your information is currently in view-only mode.
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </div>
      </footer>
    </main>
  );
}
