
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
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  Landmark,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
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

const PROFILE_COLUMNS =
  "id, full_name, email, phone_number, address, role, avatar_url";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoMenuRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [avatarSrc, setAvatarSrc] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const photoBusy = uploading || removing;


  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        setAuthEmail(user.email || "");
        setPendingEmail(user.new_email || "");

        const { data, error } = await supabase
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          throw new Error(
            error?.message || "Profile not found."
          );
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
                3600
              );

          if (!cancelled) {
            if (signedError) {
              console.warn(
                "Avatar loading error:",
                signedError
              );
            } else {
              setAvatarSrc(signedData?.signedUrl || "");
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load profile."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);


  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        photoMenuRef.current &&
        !photoMenuRef.current.contains(event.target as Node)
      ) {
        setPhotoMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }


  function handleEditProfile() {
    clearMessages();
    setIsEditing(true);
  }

  function cancelSelectedPhoto() {
    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCancelEditing() {
    if (!profile || photoBusy) return;

    setFullName(profile.full_name || "");
    setPhoneNumber(profile.phone_number || "");
    setAddress(profile.address || "");

    setIsEditing(false);
    setPhotoMenuOpen(false);
    setShowRemoveConfirm(false);
    cancelSelectedPhoto();
    clearMessages();
  }


  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    clearMessages();
    setPhotoMenuOpen(false);

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

  function openPhotoPicker() {
    if (!isEditing || photoBusy) return;

    setPhotoMenuOpen(false);
    fileInputRef.current?.click();
  }


  async function uploadProfilePicture() {
    if (
      !selectedFile ||
      !profile ||
      !isEditing ||
      photoBusy
    ) {
      return;
    }

    setUploading(true);
    clearMessages();

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
        throw new Error(
          "Account verification failed."
        );
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

      if (uploadError) throw uploadError;

      uploadedPath = filePath;
      const previousPath = profile.avatar_url;

      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({ avatar_url: filePath })
        .eq("id", user.id)
        .select(PROFILE_COLUMNS)
        .single();

      if (updateError) throw updateError;

      const {
        data: signedData,
        error: signedError,
      } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(filePath, 3600);

      if (signedError) {
        console.warn(
          "Avatar signed URL error:",
          signedError
        );
      }

      setProfile(updatedProfile as Profile);
      setAvatarSrc(signedData?.signedUrl || "");
      cancelSelectedPhoto();

      setSuccessMessage(
        "Profile picture updated successfully."
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
            "Old avatar cleanup failed:",
            removeError
          );
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload profile picture."
      );

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


  async function removeProfilePicture() {
    if (!profile || !isEditing || photoBusy) return;

    setRemoving(true);
    clearMessages();

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
        throw new Error(
          "Account verification failed."
        );
      }

      const previousPath = profile.avatar_url;


      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id)
        .select(PROFILE_COLUMNS)
        .single();

      if (updateError) throw updateError;

      setProfile(updatedProfile as Profile);
      setAvatarSrc("");
      cancelSelectedPhoto();

      setPhotoMenuOpen(false);
      setShowRemoveConfirm(false);

      setSuccessMessage(
        "Profile picture removed successfully."
      );


      if (
        previousPath &&
        previousPath.startsWith(`${user.id}/`)
      ) {
        const { error: storageError } =
          await supabase.storage
            .from(BUCKET)
            .remove([previousPath]);

        if (storageError) {
          console.warn(
            "Avatar cleanup failed:",
            storageError
          );
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove profile picture."
      );
    } finally {
      setRemoving(false);
    }
  }


  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile || !isEditing || saving || photoBusy) {
      return;
    }

    setSaving(true);
    clearMessages();

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
        throw new Error(
          "Account verification failed."
        );
      }

      if (!fullName.trim()) {
        throw new Error(
          "Full name is required."
        );
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          address: address.trim(),
        })
        .eq("id", user.id)
        .select(PROFILE_COLUMNS)
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      setFullName(data.full_name || "");
      setPhoneNumber(data.phone_number || "");
      setAddress(data.address || "");

      setIsEditing(false);
      setPhotoMenuOpen(false);
      cancelSelectedPhoto();

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


  async function handleEmailChange(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (emailSaving) return;

    clearMessages();

    const cleanedEmail =
      newEmail.trim().toLowerCase();

    if (!cleanedEmail) {
      setErrorMessage(
        "Please enter a new email address."
      );
      return;
    }

    if (
      cleanedEmail === authEmail.toLowerCase()
    ) {
      setErrorMessage(
        "This is already your registered email address."
      );
      return;
    }

    setEmailSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { error } =
        await supabase.auth.updateUser({
          email: cleanedEmail,
        });

      if (error) throw error;

      setPendingEmail(cleanedEmail);
      setNewEmail("");
      setIsChangingEmail(false);

      setSuccessMessage(
        "Email change requested. Please check the required verification emails. Your current login email remains active until the change is confirmed."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to request email change."
      );
    } finally {
      setEmailSaving(false);
    }
  }


  async function refreshEmail() {
    clearMessages();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      setErrorMessage(
        "Unable to refresh your account email."
      );
      return;
    }

    setAuthEmail(user.email || "");
    setPendingEmail(user.new_email || "");

    setSuccessMessage(
      user.new_email
        ? "Your email change is still awaiting verification."
        : "Your registered email has been refreshed."
    );
  }

  const editableInputClass = (enabled: boolean) =>
    `mt-4 w-full border px-4 py-4 text-sm outline-none transition ${
      enabled
        ? "border-[#cdd9e2] bg-[#f8fafc] text-[#173149] focus:border-[#0b304b] focus:ring-2 focus:ring-[#0b304b]/10"
        : "cursor-not-allowed border-[#dce3e8] bg-[#edf2f5] text-[#718391]"
    }`;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5]">
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

      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#c7d7e3]">
            Digital Citizen Services Portal
          </span>

          <span className="hidden text-xs text-[#c7d7e3] sm:block">
            eBarangay Connect
          </span>
        </div>
      </div>


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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d5bd81]">
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


      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{
            backgroundImage:
              "url('/barangay-hall.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-[#061b2b]/95 via-[#0b304b]/90 to-[#0b304b]/75" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#d5bd81]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#e2c991]">
              Resident Portal
            </p>
          </div>

          <h1 className="mt-6 text-4xl font-black sm:text-5xl">
            My Profile
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9]">
            Manage your account information,
            registered email address, and profile
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


      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">

        {errorMessage && (
          <div
            role="alert"
            className="mb-7 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">
              Something went wrong
            </p>

            <p className="mt-2 break-word text-sm text-[#943d31]">
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
              className="shrink-0 text-[#357c60]"
            />

            <div>
              <p className="font-black text-[#245e48]">
                Success
              </p>

              <p className="mt-2 text-sm leading-6 text-[#376a55]">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {profile && (
          <div className="grid items-start gap-7 lg:grid-cols-[0.68fr_1.32fr]">

            <aside className="min-w-0 space-y-6">

              <section className="bg-[#0b304b] p-7 text-white sm:p-8">

                <div
                  ref={photoMenuRef}
                  className="relative inline-block"
                >
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#d5bd81] bg-white/10">
                    {previewUrl || avatarSrc ? (
                      <Image
                            src={previewUrl || avatarSrc}
                            alt="Your profile picture"
                            width={96}
                            height={96}
                            unoptimized
                            className="h-full w-full object-cover"
                        />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#e2c991]">
                        <UserRound size={39} />
                      </div>
                    )}
                  </div>


                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setPhotoMenuOpen(
                            !photoMenuOpen
                          )
                        }
                        disabled={photoBusy}
                        aria-label="Edit profile picture"
                        aria-expanded={photoMenuOpen}
                        title="Edit profile picture"
                        className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0b304b] bg-[#d5bd81] text-[#0b304b] shadow-lg transition hover:scale-110 hover:bg-white disabled:opacity-50"
                      >
                        {photoBusy ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Pencil size={16} />
                        )}
                      </button>


                      {photoMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-3 w-60 max-w-[calc(100vw-4rem)] overflow-hidden border border-[#dce3e8] bg-white py-2 text-[#0b304b] shadow-xl">
                          <p className="border-b border-[#e3e9ee] px-4 pb-3 pt-2 text-xs font-black uppercase tracking-wider text-[#9b7b40]">
                            Profile Picture
                          </p>

                          <button
                            type="button"
                            onClick={openPhotoPicker}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition hover:bg-[#edf2f5]"
                          >
                            <ImagePlus size={18} />
                            Change Picture
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPhotoMenuOpen(false);
                              setShowRemoveConfirm(true);
                            }}
                            disabled={
                              !profile.avatar_url &&
                              !selectedFile
                            }
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[#b74d3d] transition hover:bg-[#fdf0ed] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={18} />
                            Remove Picture
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>


                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={!isEditing || photoBusy}
                  aria-label="Choose profile picture"
                />


                {isEditing && selectedFile && (
                  <div className="mt-5 border border-white/20 bg-white/10 p-4">
                    <div className="flex items-center gap-2 text-[#e2c991]">
                      <Camera size={17} />
                      <p className="text-xs font-black">
                        New Picture Selected
                      </p>
                    </div>

                    <p className="mt-3 break-all text-xs leading-5 text-[#d6e1e9]">
                      {selectedFile.name}
                    </p>

                    <p className="mt-2 text-xs text-[#c7d7e3]">
                      JPG, PNG, or WebP · Maximum 2 MB
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        void uploadProfilePicture()
                      }
                      disabled={photoBusy}
                      className="mt-4 flex w-full items-center justify-center gap-2 bg-[#d5bd81] px-4 py-3 text-xs font-black text-[#0b304b] transition hover:bg-white disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Save Picture
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={cancelSelectedPhoto}
                      disabled={photoBusy}
                      className="mt-2 w-full px-4 py-2 text-xs font-bold text-[#d6e1e9] hover:text-white disabled:opacity-50"
                    >
                      Cancel Selection
                    </button>
                  </div>
                )}

                <p className="mt-7 text-xs font-bold uppercase tracking-widest text-[#e2c991]">
                  Your Account
                </p>

                <h2 className="mt-3 break-word text-2xl font-black">
                  {profile.full_name || "Resident"}
                </h2>

                <p className="mt-3 break-all text-sm leading-7 text-[#c7d7e3]">
                  {authEmail || "No email available"}
                </p>

                <div className="mt-7 border-t border-white/20 pt-7">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#e2c991]">
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


              <section className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                    <Mail size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#9b7b40]">
                      Account Settings
                    </p>

                    <h2 className="mt-2 text-lg font-black leading-snug text-[#0b304b]">
                      Change Email Address
                    </h2>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-[#697d8c]">
                  Update your registered login email.
                  Verification is required before the
                  new address becomes active.
                </p>


                <div className="mt-5 border border-[#dce3e8] bg-[#f8fafc] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#8193a2]">
                    Current Email
                  </p>

                  <p className="mt-2 break-all text-sm font-bold text-[#0b304b]">
                    {authEmail || "Not available"}
                  </p>
                </div>


                {pendingEmail && (
                  <div className="mt-4 border border-[#e6d5ac] bg-[#fffaf0] p-4">
                    <p className="text-xs font-bold uppercase text-[#8e6b25]">
                      Pending Email Change
                    </p>

                    <p className="mt-2 break-all text-sm text-[#173149]">
                      {pendingEmail}
                    </p>

                    <p className="mt-2 text-xs leading-6 text-[#697d8c]">
                      Follow the verification
                      instructions sent to your email.
                    </p>
                  </div>
                )}


                {!isChangingEmail ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingEmail(true);
                      clearMessages();
                    }}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#0b304b] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#164866]"
                  >
                    <Pencil size={16} />
                    Change Email
                  </button>
                ) : (
                  <form
                    onSubmit={handleEmailChange}
                    className="mt-5 space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="newEmail"
                        className="block text-sm font-bold text-[#173149]"
                      >
                        New Email Address
                      </label>

                      <input
                        id="newEmail"
                        type="email"
                        required
                        autoComplete="email"
                        value={newEmail}
                        onChange={(event) =>
                          setNewEmail(
                            event.target.value
                          )
                        }
                        placeholder="Enter your new email"
                        disabled={emailSaving}
                        className="mt-3 w-full min-w-0 border border-[#cdd9e2] bg-[#f8fafc] px-4 py-3.5 text-sm outline-none focus:border-[#0b304b]"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="submit"
                        disabled={emailSaving}
                        className="inline-flex w-full items-center justify-center gap-2 bg-[#0b304b] px-4 py-3.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {emailSaving ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Mail size={17} />
                        )}
                        Send Verification
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingEmail(false);
                          setNewEmail("");
                        }}
                        disabled={emailSaving}
                        className="w-full border border-[#cdd9e2] px-4 py-3 text-sm font-bold text-[#0b304b]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void refreshEmail()
                  }
                  className="mt-5 block text-left text-xs font-bold leading-6 text-[#0b304b] underline underline-offset-4 transition hover:text-[#9b7b40]"
                >
                  I have verified my new email — Refresh
                </button>
              </section>


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
                      Email changes require verification
                      through Supabase Authentication.
                      Your account role cannot be
                      changed from this page.
                    </p>
                  </div>
                </div>
              </section>
            </aside>


            <div className="min-w-0 space-y-7">

              <form
                onSubmit={handleSave}
                className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-9"
              >
                <div className="flex flex-col justify-between gap-5 border-b border-[#e3e9ee] pb-7 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                      Personal Information
                    </p>

                    <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                      Profile Details
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                      {isEditing
                        ? "You can now edit your personal information and profile picture."
                        : "Click Edit Profile to update your information."}
                    </p>
                  </div>


                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={handleEditProfile}
                      disabled={photoBusy}
                      className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#0b304b] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#164866] disabled:opacity-50"
                    >
                      <Pencil size={17} />
                      Edit Profile
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 self-start border border-[#d5bd81] bg-[#fffaf0] px-4 py-3 text-xs font-black text-[#8e6b25]">
                      <Pencil size={15} />
                      Editing Mode
                    </span>
                  )}
                </div>

                <div className="mt-8 space-y-7">

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
                        setFullName(
                          event.target.value
                        )
                      }
                      disabled={!isEditing || saving}
                      required
                      className={editableInputClass(
                        isEditing
                      )}
                    />
                  </div>


                  <div>
                    <label
                      htmlFor="email"
                      className="flex items-center gap-2 text-sm font-black text-[#173149]"
                    >
                      <Mail
                        size={17}
                        className="text-[#9b7b40]"
                      />
                      Registered Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={authEmail}
                      readOnly
                      className="mt-4 w-full border border-[#dce3e8] bg-[#edf2f5] px-4 py-4 text-sm font-semibold text-[#718391]"
                    />

                    <p className="mt-2 flex items-center gap-2 text-xs text-[#8193a2]">
                      <LockKeyhole size={13} />
                      This email is managed by
                      Supabase Authentication.
                    </p>
                  </div>


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
                        setPhoneNumber(
                          event.target.value
                        )
                      }
                      disabled={!isEditing || saving}
                      className={editableInputClass(
                        isEditing
                      )}
                    />
                  </div>


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
                        setAddress(
                          event.target.value
                        )
                      }
                      disabled={!isEditing || saving}
                      rows={4}
                      className={`${editableInputClass(
                        isEditing
                      )} resize-none leading-7`}
                    />
                  </div>


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
                      Account roles are managed
                      by the system.
                    </p>
                  </div>
                </div>


                {isEditing ? (
                  <div className="mt-9 flex flex-col-reverse gap-3 border-t border-[#e3e9ee] pt-7 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handleCancelEditing}
                      disabled={saving || photoBusy}
                      className="inline-flex items-center justify-center gap-2 border border-[#cdd9e2] px-6 py-3.5 text-sm font-bold text-[#0b304b] transition hover:bg-[#edf2f5] disabled:opacity-50"
                    >
                      <X size={17} />
                      Cancel Editing
                    </button>

                    <button
                      type="submit"
                      disabled={saving || photoBusy}
                      className="inline-flex items-center justify-center gap-2 bg-[#0b304b] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#164866] disabled:opacity-60"
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
                ) : (
                  <div className="mt-9 flex items-center gap-3 border-t border-[#e3e9ee] pt-7 text-sm text-[#697d8c]">
                    <LockKeyhole
                      size={17}
                      className="shrink-0 text-[#9b7b40]"
                    />
                    Your personal information is
                    currently in view-only mode.
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>


      {showRemoveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061b2b]/70 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-photo-title"
            className="w-full max-w-md border border-[#dce3e8] bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex h-14 w-14 items-center justify-center bg-[#fdf0ed] text-[#b74d3d]">
              <Trash2 size={25} />
            </div>

            <h2
              id="remove-photo-title"
              className="mt-6 text-xl font-black text-[#0b304b]"
            >
              Remove Profile Picture?
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#697d8c]">
              Your current profile picture will be
              removed and replaced with the default
              account avatar.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setShowRemoveConfirm(false)
                }
                disabled={removing}
                className="border border-[#cdd9e2] px-5 py-3 text-sm font-bold text-[#0b304b] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                 if (!profile?.avatar_url) {
                    cancelSelectedPhoto();
                    setShowRemoveConfirm(false);
                    setSuccessMessage(
                      "Picture selection removed."
                    );
                    return;
                  }

                  void removeProfilePicture();
                }}
                disabled={removing}
                className="inline-flex items-center justify-center gap-2 bg-[#b74d3d] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {removing ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove Picture
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      <footer className="border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>
            Digital barangay services for residents.
          </p>
        </div>
      </footer>
    </main>
  );
}
