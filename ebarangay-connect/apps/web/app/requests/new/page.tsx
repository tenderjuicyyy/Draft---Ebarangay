
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  ImagePlus,
  Landmark,
  Loader2,
  PhilippinePeso,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type DocumentType = {
  id: number;
  name: string;
  description: string | null;
  processing_days: number;
  fee: number;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function NewRequestPage() {
  const router = useRouter();

  // Document information
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [purpose, setPurpose] = useState("");

  // ID upload
  const [idFile, setIdFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Page states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // LOAD USER SESSION AND DOCUMENTS
  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (authError || !session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("document_types")
        .select("id, name, description, processing_days, fee")
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (cancelled) return;

      if (error) {
        setErrorMessage(`DOCUMENT ERROR: ${error.message}`);
      } else {
        setDocuments(data || []);
      }

      setLoading(false);
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // CLEAN UP PREVIEW URL WHEN PAGE UNMOUNTS
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  // SELECTED DOCUMENT DETAILS
  const selectedDetails = documents.find(
    (document) => document.id === Number(selectedDocument)
  );

  // FORM VALIDATION
  const canSubmit =
    Boolean(selectedDetails) &&
    Boolean(idFile) &&
    purpose.trim().length > 0 &&
    !submitting &&
    !success;

  // REMOVE OLD IMAGE PREVIEW
  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  }

  // REMOVE SELECTED ID
  function removeId() {
    clearPreview();
    setIdFile(null);
    setErrorMessage("");
  }

  // HANDLE ID FILE SELECTION
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");

    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      removeId();
      setErrorMessage(
        "Only JPG, PNG, or WEBP ID pictures are allowed."
      );
      event.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      removeId();
      setErrorMessage(
        "The ID picture must not exceed 5 MB."
      );
      event.target.value = "";
      return;
    }

    // Prevent empty files
    if (file.size === 0) {
      removeId();
      setErrorMessage(
        "The selected ID picture is empty."
      );
      event.target.value = "";
      return;
    }

    // Clear previous preview
    clearPreview();

    // Create new preview
    const url = URL.createObjectURL(file);

    previewUrlRef.current = url;
    setPreviewUrl(url);
    setIdFile(file);

    event.target.value = "";
  }

  // HANDLE REQUEST SUBMISSION
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (submitting || success) return;

    if (!selectedDetails) {
      setErrorMessage("Please select a document.");
      return;
    }

    if (!idFile) {
      setErrorMessage(
        "Please upload a picture of your valid ID."
      );
      return;
    }

    if (
      !ALLOWED_TYPES[idFile.type] ||
      idFile.size === 0 ||
      idFile.size > MAX_FILE_SIZE
    ) {
      setErrorMessage(
        "Please upload a valid ID picture."
      );
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage(
        "Please enter the purpose of your request."
      );
      return;
    }

    setSubmitting(true);

    let uploadedPath: string | null = null;
    let requestCreated = false;

    try {
      // STEP 1: Verify authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      // STEP 2: Generate unique file path
      const extension = ALLOWED_TYPES[idFile.type];

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      // STEP 3: Upload ID picture
      const { error: uploadError } = await supabase.storage
        .from("resident-ids")
        .upload(filePath, idFile, {
          contentType: idFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `ID UPLOAD ERROR: ${uploadError.message}`
        );
      }

      uploadedPath = filePath;

      // STEP 4: Save request to database
      const { data: request, error: requestError } =
        await supabase
          .from("document_requests")
          .insert({
            profile_id: user.id,
            document_type_id: selectedDetails.id,
            purpose: purpose.trim(),
            status: "Pending",
            id_image_path: filePath,
          })
          .select("id")
          .single();

      if (requestError || !request) {
        throw new Error(
          `REQUEST ERROR: ${
            requestError?.message ||
            "Unable to save your request."
          }`
        );
      }

      requestCreated = true;

      // Initial status history should be written
      // by a database trigger or secure backend
      // if residents cannot insert history due to RLS.

      setSuccess(true);

      // Redirect to My Requests
      router.push("/requests");
    } catch (error) {
      console.error("SUBMISSION ERROR:", error);

      // Delete uploaded ID if request creation failed
      if (uploadedPath && !requestCreated) {
        const { error: cleanupError } =
          await supabase.storage
            .from("resident-ids")
            .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "ID cleanup error:",
            cleanupError
          );
        }
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // LOADING SCREEN
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-6 font-sans">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#0b304b] text-white">
            <Loader2
              size={28}
              className="animate-spin"
            />
          </div>

          <p className="mt-5 text-lg font-black text-[#0b304b]">
            Preparing your request
          </p>

          <p className="mt-2 text-sm text-[#697d8c]">
            Checking your account and available services.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">

      {/* TOP BAR */}
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
              <Landmark
                size={23}
                strokeWidth={1.7}
              />
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
            className="inline-flex items-center gap-2 border border-white/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b]"
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
              Document Services
            </p>
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Request a Barangay Document
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
            Select the document you need, upload a picture
            of your valid ID, and provide the purpose of
            your request. You can monitor its status
            through My Requests.
          </p>

          <div className="mt-7 flex flex-wrap gap-5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
              <FileText
                size={18}
                className="text-[#e2c991]"
              />
              Online Submission
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
              <ShieldCheck
                size={18}
                className="text-[#e2c991]"
              />
              Secure ID Upload
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
              <Clock3
                size={18}
                className="text-[#e2c991]"
              />
              Status Tracking
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-12">

        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] transition hover:text-[#9b7b40]"
        >
          
        </button>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-7 border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-black text-[#943d31]">
              Unable to continue
            </p>

            <p className="mt-2 wrap-break-word text-sm leading-7 text-[#943d31]">
              {errorMessage}
            </p>
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
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
                Request submitted
              </p>

              <p className="mt-2 text-sm leading-7 text-[#376a55]">
                Your document request was submitted
                successfully. Redirecting to My Requests...
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">

          {/* REQUEST FORM */}
          <section className="border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-9">

            <div className="border-b border-[#e3e9ee] pb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                New Request
              </p>

              <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                Request Information
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                Complete all required fields before
                submitting your barangay document request.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8"
            >

              {/* SELECT DOCUMENT */}
              <div>
                <label
                  htmlFor="document"
                  className="text-sm font-black text-[#173149]"
                >
                  Select Document *
                </label>

                <p className="mt-2 text-xs text-[#8193a2]">
                  Choose the barangay document you want
                  to request.
                </p>

                <select
                  id="document"
                  value={selectedDocument}
                  onChange={(event) => {
                    setSelectedDocument(event.target.value);
                    setErrorMessage("");
                  }}
                  disabled={submitting || success}
                  required
                  className="mt-4 w-full border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm font-semibold text-[#173149] outline-none transition focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    Choose a document
                  </option>

                  {documents.map((document) => (
                    <option
                      key={document.id}
                      value={document.id}
                    >
                      {document.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTED DOCUMENT DETAILS */}
              {selectedDetails && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">

                  {/* PROCESSING TIME */}
                  <div className="bg-[#edf2f5] p-5">
                    <div className="flex items-center gap-2 text-[#0b304b]">
                      <Clock3 size={18} />

                      <span className="text-xs font-bold uppercase tracking-wide">
                        Processing Time
                      </span>
                    </div>

                    <p className="mt-3 text-lg font-black text-[#0b304b]">
                      {selectedDetails.processing_days}{" "}
                      {selectedDetails.processing_days === 1
                        ? "day"
                        : "days"}
                    </p>
                  </div>

                  {/* DOCUMENT FEE */}
                  <div className="bg-[#f8f0df] p-5">
                    <div className="flex items-center gap-2 text-[#9b7b40]">
                      <PhilippinePeso size={18} />

                      <span className="text-xs font-bold uppercase tracking-wide">
                        Document Fee
                      </span>
                    </div>

                    <p className="mt-3 text-lg font-black text-[#0b304b]">
                      {Number(selectedDetails.fee) === 0
                        ? "Free"
                        : `₱${Number(
                            selectedDetails.fee
                          ).toFixed(2)}`}
                    </p>
                  </div>

                  {/* DESCRIPTION */}
                  {selectedDetails.description && (
                    <div className="bg-[#edf2f5] p-5 sm:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#9b7b40]">
                        About This Document
                      </p>

                      <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                        {selectedDetails.description}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MANDATORY ID UPLOAD */}
              {selectedDetails && (
                <div className="mt-8">
                  <div className="flex items-center gap-3">
                    <ImagePlus
                      size={23}
                      className="text-[#0b304b]"
                    />

                    <div>
                      <h3 className="text-base font-black text-[#0b304b]">
                        Upload Valid ID *
                      </h3>

                      <p className="mt-1 text-xs text-[#697d8c]">
                        A valid ID picture is required
                        for every document request.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-2 border-dashed border-[#cdd9e2] bg-[#f8fafc] p-6">

                    {!idFile ? (
                      <label className="flex cursor-pointer flex-col items-center gap-3 text-center">

                        <UploadCloud
                          size={34}
                          className="text-[#9b7b40]"
                        />

                        <span className="text-sm font-black text-[#0b304b]">
                          Click to upload your ID picture
                        </span>

                        <span className="text-xs text-[#697d8c]">
                          JPG, PNG, WEBP — Maximum 5 MB
                        </span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          disabled={submitting || success}
                          className="sr-only"
                        />
                      </label>
                    ) : (
                      <div className="space-y-4">

                        {/* IMAGE PREVIEW */}
                        {previewUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt="Selected ID preview"
                            className="mx-auto max-h-64 max-w-full rounded object-contain"
                          />
                        )}

                        {/* FILE INFORMATION */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#0b304b]">
                              {idFile.name}
                            </p>

                            <p className="text-xs text-[#697d8c]">
                              {(
                                idFile.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>

                          {/* REMOVE ID */}
                          <button
                            type="button"
                            onClick={removeId}
                            disabled={submitting || success}
                            aria-label="Remove selected ID"
                            className="p-2 text-[#943d31] transition hover:bg-[#fdf0ed]"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <p className="flex items-center gap-2 text-xs font-bold text-[#357c60]">
                          <CheckCircle2 size={16} />
                          ID picture selected successfully
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-6 text-[#697d8c]">
                    Your ID will be stored privately and
                    reviewed by authorized barangay personnel.
                    Upload only your own valid ID.
                  </p>
                </div>
              )}

              {/* PURPOSE OF REQUEST */}
              <div className="mt-8">
                <label
                  htmlFor="purpose"
                  className="text-sm font-black text-[#173149]"
                >
                  Purpose of Request *
                </label>

                <p className="mt-2 text-xs text-[#8193a2]">
                  Briefly explain why you need this document.
                </p>

                <textarea
                  id="purpose"
                  value={purpose}
                  onChange={(event) =>
                    setPurpose(event.target.value)
                  }
                  disabled={submitting || success}
                  rows={6}
                  required
                  placeholder="Example: Employment requirement, school requirement, scholarship application..."
                  className="mt-4 w-full resize-none border border-[#cdd9e2] bg-[#f8fafc] px-4 py-4 text-sm leading-7 text-[#173149] outline-none transition placeholder:text-[#98a9b5] focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              {/* FORM ACTIONS */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#e3e9ee] pt-7 sm:flex-row sm:items-center sm:justify-between">

                {/* CANCEL */}
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 border border-[#cdd9e2] px-6 py-3.5 text-sm font-bold text-[#0b304b] transition hover:bg-[#edf2f5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Cancel
                </button>

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 bg-[#0b304b] px-7 py-3.5 text-sm font-black text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* SIDE PANEL */}
          <aside className="space-y-6">

            {/* PROCESS */}
            <div className="bg-[#0b304b] p-7 text-white">
              <div className="flex h-12 w-12 items-center justify-center border border-white/20 bg-white/10 text-[#e2c991]">
                <FileCheck2 size={22} />
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#e2c991]">
                Simple Process
              </p>

              <h2 className="mt-3 text-2xl font-black leading-tight">
                What happens next?
              </h2>

              <div className="mt-8 space-y-7">
                {[
                  {
                    title: "Select Document",
                    description:
                      "Choose the barangay document you need.",
                  },
                  {
                    title: "Upload ID and Submit",
                    description:
                      "Upload your valid ID picture and provide your purpose.",
                  },
                  {
                    title: "Track Your Status",
                    description:
                      "Monitor your request through My Requests.",
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center text-xs font-black ${
                        index === 0
                          ? "bg-[#d5bd81] text-[#0b304b]"
                          : "border border-white/30 bg-white/10 text-white"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <p className="text-sm font-black">
                        {step.title}
                      </p>

                      <p className="mt-2 text-xs leading-6 text-[#c7d7e3]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/requests"
                className="mt-9 inline-flex items-center gap-2 text-sm font-black text-[#e2c991] transition hover:text-white"
              >
                
              </Link>
            </div>

            {/* ACCOUNT INFORMATION */}
            <div className="border border-[#dce3e8] bg-white p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <p className="font-black text-[#0b304b]">
                    Resident Account
                  </p>

                  <p className="mt-1 text-xs text-[#8193a2]">
                    Authenticated request submission
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[#697d8c]">
                Your request is connected to your
                authenticated resident account so you
                can monitor its progress after submission.
              </p>
            </div>
          </aside>
        </div>
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
