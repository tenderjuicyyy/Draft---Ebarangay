
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
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
const MAX_PURPOSE_LENGTH = 500;

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const APPROVED_DOCUMENT_NAMES = [
  "Barangay Clearance",
  "Certificate of Residency",
  "Certificate of Indigency",
];

const inputClass =
  "mt-3 w-full rounded-lg border border-[#cdd9e2] bg-[#f8fafc] px-4 py-3.5 text-sm text-[#173149] outline-none transition focus:border-[#0b304b] focus:bg-white focus:ring-2 focus:ring-[#0b304b]/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function NewRequestPage() {
  const router = useRouter();

  const previewUrlRef = useRef<string | null>(null);
  const submissionLock = useRef(false);

  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [purpose, setPurpose] = useState("");

  const [idFile, setIdFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null
  );

  const [requirementsConfirmed, setRequirementsConfirmed] =
    useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // LOAD AUTHENTICATED USER AND DOCUMENT TYPES
  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
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

        const { data, error } = await supabase
          .from("document_types")
          .select(
            "id, name, description, processing_days, fee"
          )
          .eq("is_active", true)
          .in("name", APPROVED_DOCUMENT_NAMES)
          .order("id", { ascending: true });

        if (cancelled) return;

        if (error) {
          throw new Error(
            `Unable to load documents: ${error.message}`
          );
        }

        setDocuments(data || []);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to prepare the request form."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // CLEAN UP IMAGE PREVIEW
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const selectedDetails = documents.find(
    (document) => document.id === Number(selectedDocument)
  );

  const trimmedPurpose = purpose.trim();

  const purposeValid =
    trimmedPurpose.length >= 10 &&
    trimmedPurpose.length <= MAX_PURPOSE_LENGTH;

  const canReview =
    Boolean(selectedDetails) &&
    Boolean(idFile) &&
    purposeValid &&
    requirementsConfirmed &&
    !submitting &&
    !success;

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  }

  function removeId() {
    clearPreview();
    setIdFile(null);
    setReviewOpen(false);
  }

  function handleDocumentChange(value: string) {
    setSelectedDocument(value);
    setRequirementsConfirmed(false);
    setReviewOpen(false);
    setErrorMessage("");
  }

  // HANDLE FILE UPLOAD
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setErrorMessage("");
    setReviewOpen(false);

    if (!ALLOWED_TYPES[file.type]) {
      removeId();
      setErrorMessage(
        "Only JPG, PNG, or WebP ID pictures are allowed."
      );
      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      removeId();
      setErrorMessage("The selected ID picture is empty.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      removeId();
      setErrorMessage(
        "Your ID picture must not exceed 5 MB."
      );
      event.target.value = "";
      return;
    }

    clearPreview();

    const url = URL.createObjectURL(file);

    previewUrlRef.current = url;
    setPreviewUrl(url);
    setIdFile(file);

    event.target.value = "";
  }

  function validateRequest(): string | null {
    if (!selectedDetails) {
      return "Please select a document.";
    }

    if (!idFile) {
      return "Please upload a picture of your valid ID.";
    }

    if (
      !ALLOWED_TYPES[idFile.type] ||
      idFile.size === 0 ||
      idFile.size > MAX_FILE_SIZE
    ) {
      return "Please upload a valid ID picture.";
    }

    if (trimmedPurpose.length < 10) {
      return (
        "Please explain your purpose using at least " +
        "10 characters."
      );
    }

    if (trimmedPurpose.length > MAX_PURPOSE_LENGTH) {
      return "Your purpose must not exceed 500 characters.";
    }

    if (!requirementsConfirmed) {
      return (
        "Please confirm that you have reviewed " +
        "the document requirements."
      );
    }

    return null;
  }

  // REVIEW BEFORE FINAL SUBMISSION
  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const validationError = validateRequest();

    if (validationError) {
      setErrorMessage(validationError);
      setReviewOpen(false);
      return;
    }

    setReviewOpen(true);
  }

  // FINAL REQUEST SUBMISSION
  async function submitRequest() {
    if (submissionLock.current || success) return;

    const validationError = validateRequest();

    if (validationError) {
      setErrorMessage(validationError);
      setReviewOpen(false);
      return;
    }

    if (!selectedDetails || !idFile) return;

    submissionLock.current = true;
    setSubmitting(true);
    setErrorMessage("");

    let uploadedPath: string | null = null;
    let requestCreated = false;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // RECHECK DOCUMENT AVAILABILITY
      const { data: currentDocument, error: documentError } =
        await supabase
          .from("document_types")
          .select("id")
          .eq("id", selectedDetails.id)
          .eq("is_active", true)
          .in("name", APPROVED_DOCUMENT_NAMES)
          .maybeSingle();

      if (documentError || !currentDocument) {
        throw new Error(
          "This document is no longer available for requests."
        );
      }

      // UPLOAD ID
      const extension = ALLOWED_TYPES[idFile.type];

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("resident-ids")
        .upload(filePath, idFile, {
          contentType: idFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `ID upload failed: ${uploadError.message}`
        );
      }

      uploadedPath = filePath;

      // CREATE DOCUMENT REQUEST
      const { data: request, error: requestError } =
        await supabase
          .from("document_requests")
          .insert({
            profile_id: user.id,
            document_type_id: selectedDetails.id,
            purpose: trimmedPurpose,
            status: "Pending",
            id_image_path: filePath,
          })
          .select("id")
          .single();

      if (requestError || !request) {
        throw new Error(
          requestError?.message ||
            "Unable to save your document request."
        );
      }

      requestCreated = true;
      setSuccess(true);
      setReviewOpen(false);

      // Initial status history should be handled by
      // a database trigger or trusted backend.
      router.push("/requests");
    } catch (error) {
      console.error("Request submission error:", error);

      // CLEAN UP ID IF REQUEST WAS NOT CREATED
      if (uploadedPath && !requestCreated) {
        const { error: cleanupError } =
          await supabase.storage
            .from("resident-ids")
            .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Unable to clean up uploaded ID:",
            cleanupError
          );
        }
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );

      setReviewOpen(false);
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-5">
        <div className="text-center text-[#0b304b]">
          <Loader2
            size={32}
            className="mx-auto animate-spin"
          />
          <p className="mt-4 font-bold">
            Preparing your request...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl justify-between gap-3 px-5 py-3 text-xs sm:px-8">
          <span className="font-bold uppercase tracking-widest text-[#c7d7e3]">
            Digital Citizen Services Portal
          </span>
          <span className="hidden sm:block">
            eBarangay Connect
          </span>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="rounded-full border-2 border-[#d5bd81] p-3 text-[#d5bd81]">
              <Landmark size={22} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d5bd81]">
                Digital Barangay Portal
              </p>
              <p className="text-lg font-black">
                eBarangay Connect
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">
              Dashboard
            </span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage: "url('/barangay-hall.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-r from-[#061b2b]/95 to-[#0b304b]/80" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#d5bd81]">
            Document Services
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Request a Barangay Document
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d6e1e9]">
            Review the requirements, complete your
            information, and submit your request online.
            Track its progress through My Requests.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-9 sm:px-8">
        <Link
          href="/dashboard"
          className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#0b304b]"
        >
          
        </Link>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 border-l-4 border-red-600 bg-red-50 p-5 text-sm text-red-800"
          >
            <strong>Unable to continue</strong>
            <p className="mt-2">{errorMessage}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 border-l-4 border-green-700 bg-green-50 p-5 text-sm text-green-800"
          >
            <CheckCircle2 size={20} />
            Request submitted successfully.
            Redirecting to My Requests...
          </div>
        )}

        <div className="grid gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          {/* REQUEST FORM */}
          <section className="rounded-xl border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-9">
            <div className="border-b pb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                New Request
              </p>

              <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                Request Information
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                Fields marked with * are required.
                Review the information carefully before
                final submission.
              </p>
            </div>

            <form
              onSubmit={handleReview}
              className="mt-7 space-y-8"
            >
              {/* DOCUMENT SELECTION */}
              <div>
                <label
                  htmlFor="document"
                  className="text-sm font-black text-[#173149]"
                >
                  Select Document *
                </label>

                <p className="mt-2 text-xs text-[#8193a2]">
                  Select one of the supported barangay
                  documents.
                </p>

                <select
                  id="document"
                  value={selectedDocument}
                  onChange={(event) =>
                    handleDocumentChange(event.target.value)
                  }
                  disabled={submitting || success}
                  required
                  className={inputClass}
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

                {documents.length === 0 && (
                  <p className="mt-3 text-sm text-amber-700">
                    No supported documents are currently
                    available. Please contact the barangay
                    office.
                  </p>
                )}
              </div>

              {/* GUIDED REQUIREMENTS */}
              {selectedDetails && (
                <div className="space-y-5">
                  <section className="rounded-xl border border-[#d5bd81] bg-[#fcf9f1] p-6">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck
                        size={24}
                        className="text-[#9b7b40]"
                      />

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                          Before You Continue
                        </p>

                        <h3 className="mt-1 text-lg font-black text-[#0b304b]">
                          Document Requirements
                        </h3>
                      </div>
                    </div>

                    <p className="mt-5 text-sm font-bold text-[#0b304b]">
                      {selectedDetails.name}
                    </p>

                    <p className="mt-2 text-sm leading-7 text-[#697d8c]">
                      Review the information needed for
                      this online request:
                    </p>

                    <ul className="mt-5 space-y-4">
                      {[
                        "An active resident account",
                        "A clear picture of your valid ID",
                        "A complete and accurate purpose of request",
                        "Correct contact and personal information in your profile",
                      ].map((requirement) => (
                        <li
                          key={requirement}
                          className="flex items-start gap-3 text-sm text-[#173149]"
                        >
                          <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0 text-[#357c60]"
                          />
                          <span>{requirement}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 rounded-lg bg-white p-4 text-xs leading-6 text-[#697d8c]">
                      <strong className="text-[#0b304b]">
                        Important:
                      </strong>{" "}
                      These are the requirements for
                      completing the online form. Additional
                      physical requirements, if any, must be
                      confirmed with your barangay office.
                    </div>

                    <label className="mt-6 flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={requirementsConfirmed}
                        onChange={(event) => {
                          setRequirementsConfirmed(
                            event.target.checked
                          );
                          setReviewOpen(false);
                        }}
                        disabled={submitting || success}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#0b304b]"
                      />

                      <span className="text-sm font-bold leading-6 text-[#0b304b]">
                        I have reviewed the requirements
                        and understand what I need to
                        submit.
                      </span>
                    </label>
                  </section>

                  {/* DOCUMENT DETAILS */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-[#edf2f5] p-5">
                      <div className="flex items-center gap-2 text-[#0b304b]">
                        <Clock3 size={18} />
                        <span className="text-xs font-bold uppercase">
                          Processing Time
                        </span>
                      </div>

                      <p className="mt-3 text-lg font-black text-[#0b304b]">
                        {selectedDetails.processing_days}{" "}
                        {selectedDetails.processing_days === 1
                          ? "day"
                          : "days"}
                      </p>

                      <p className="mt-2 text-xs text-[#697d8c]">
                        Estimated processing time
                      </p>
                    </div>

                    <div className="rounded-lg bg-[#f8f0df] p-5">
                      <div className="flex items-center gap-2 text-[#9b7b40]">
                        <PhilippinePeso size={18} />
                        <span className="text-xs font-bold uppercase">
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

                      <p className="mt-2 text-xs text-[#697d8c]">
                        No online payment is required.
                      </p>
                    </div>

                    {selectedDetails.description && (
                      <div className="rounded-lg bg-[#edf2f5] p-5 sm:col-span-2">
                        <p className="text-xs font-bold uppercase text-[#9b7b40]">
                          About This Document
                        </p>

                        <p className="mt-3 text-sm leading-7 text-[#697d8c]">
                          {selectedDetails.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ID UPLOAD */}
              {selectedDetails && (
                <section>
                  <div className="flex items-center gap-3">
                    <ImagePlus
                      size={23}
                      className="text-[#0b304b]"
                    />

                    <div>
                      <h3 className="font-black text-[#0b304b]">
                        Upload Valid ID *
                      </h3>

                      <p className="mt-1 text-xs text-[#697d8c]">
                        Upload a clear picture of your
                        own valid ID.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border-2 border-dashed border-[#cdd9e2] bg-[#f8fafc] p-6">
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
                          JPG, PNG, WebP — Maximum 5 MB
                        </span>

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          disabled={submitting || success}
                          className="sr-only"
                          aria-label="Upload valid ID picture"
                        />
                      </label>
                    ) : (
                      <div className="space-y-4">
                        {previewUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt="Selected ID preview"
                            className="mx-auto max-h-64 max-w-full rounded object-contain"
                          />
                        )}

                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#0b304b]">
                              {idFile.name}
                            </p>

                            <p className="mt-1 text-xs text-[#697d8c]">
                              {(
                                idFile.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={removeId}
                            disabled={submitting || success}
                            aria-label="Remove selected ID"
                            className="rounded-lg p-2 text-red-700 hover:bg-red-50"
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
                    Your ID must be stored in private
                    storage and accessible only to
                    authorized users. Do not upload
                    another person&apos;s ID.
                  </p>
                </section>
              )}

              {/* PURPOSE */}
              <div>
                <label
                  htmlFor="purpose"
                  className="text-sm font-black text-[#173149]"
                >
                  Purpose of Request *
                </label>

                <p className="mt-2 text-xs text-[#8193a2]">
                  Explain why you need this document.
                  Minimum 10 characters, maximum 500.
                </p>

                <textarea
                  id="purpose"
                  value={purpose}
                  onChange={(event) => {
                    setPurpose(event.target.value);
                    setReviewOpen(false);
                  }}
                  disabled={submitting || success}
                  rows={5}
                  minLength={10}
                  maxLength={MAX_PURPOSE_LENGTH}
                  required
                  placeholder="Example: I need this document for my scholarship application."
                  className={inputClass}
                />

                <div className="mt-2 flex justify-between gap-3 text-xs text-[#8193a2]">
                  <span>
                    {trimmedPurpose.length > 0 &&
                    trimmedPurpose.length < 10
                      ? "Please provide more details."
                      : "Provide a clear and accurate purpose."}
                  </span>

                  <span>
                    {purpose.length}/{MAX_PURPOSE_LENGTH}
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 border-t pt-7 sm:flex-row sm:justify-between">
                <Link
                  href="/requests"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cdd9e2] px-6 py-3.5 text-sm font-bold text-[#0b304b] hover:bg-[#edf2f5]"
                >
                  <ArrowLeft size={16} />
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={!canReview}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0b304b] px-7 py-3.5 text-sm font-black text-white hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Review Request
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          </section>

          {/* SIDE PANEL */}
          <aside className="space-y-6">
            <section className="rounded-xl bg-[#0b304b] p-7 text-white">
              <FileCheck2
                size={28}
                className="text-[#d5bd81]"
              />

              <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[#d5bd81]">
                Simple Process
              </p>

              <h2 className="mt-3 text-2xl font-black">
                How It Works
              </h2>

              <div className="mt-7 space-y-6">
                {[
                  {
                    title: "Select Document",
                    description:
                      "Choose one of the three supported documents.",
                  },
                  {
                    title: "Review Requirements",
                    description:
                      "Check the requirements before continuing.",
                  },
                  {
                    title: "Complete Information",
                    description:
                      "Upload your ID and explain your purpose.",
                  },
                  {
                    title: "Review and Submit",
                    description:
                      "Confirm the details of your request.",
                  },
                  {
                    title: "Track Request",
                    description:
                      "Monitor progress through My Requests.",
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className="flex gap-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d5bd81] text-xs font-black text-[#0b304b]">
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
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#d5bd81]"
              >
                View My Requests
                <ArrowRight size={16} />
              </Link>
            </section>

            <section className="rounded-xl border border-[#dce3e8] bg-white p-7">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  size={23}
                  className="text-[#0b304b]"
                />
                <h3 className="font-black text-[#0b304b]">
                  Resident Account
                </h3>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#697d8c]">
                Your request will be connected to your
                authenticated account. Barangay personnel
                will review your submitted information
                before processing your request.
              </p>

              <Link
                href="/profile"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] underline"
              >
                Review My Profile
              </Link>
            </section>
          </aside>
        </div>
      </div>

      {/* REVIEW MODAL */}
      {reviewOpen && selectedDetails && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#061b2b]/75 p-4"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                  Final Step
                </p>

                <h2
                  id="review-title"
                  className="mt-2 text-2xl font-black text-[#0b304b]"
                >
                  Review Your Request
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                disabled={submitting}
                aria-label="Close review"
                className="rounded-lg p-2 hover:bg-[#eef2f5] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-[#697d8c]">
              Please verify your information before
              submitting your request.
            </p>

            <dl className="mt-6 space-y-5 rounded-lg bg-[#f5f8fa] p-5">
              <div>
                <dt className="text-xs font-bold uppercase text-[#8193a2]">
                  Document
                </dt>
                <dd className="mt-1 font-bold text-[#0b304b]">
                  {selectedDetails.name}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-[#8193a2]">
                  Purpose
                </dt>
                <dd className="mt-1 wrap-break-word text-sm leading-6 text-[#173149]">
                  {trimmedPurpose}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-[#8193a2]">
                  Uploaded ID
                </dt>
                <dd className="mt-1 break-all text-sm font-bold text-[#0b304b]">
                  {idFile?.name}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-[#8193a2]">
                  Estimated Processing Time
                </dt>
                <dd className="mt-1 text-sm text-[#173149]">
                  {selectedDetails.processing_days}{" "}
                  {selectedDetails.processing_days === 1
                    ? "day"
                    : "days"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase text-[#8193a2]">
                  Document Fee
                </dt>
                <dd className="mt-1 text-sm text-[#173149]">
                  {Number(selectedDetails.fee) === 0
                    ? "Free"
                    : `₱${Number(
                        selectedDetails.fee
                      ).toFixed(2)}`}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-[#cdd9e2] px-5 py-3 text-sm font-bold text-[#0b304b] disabled:opacity-50"
              >
                Go Back
              </button>

              <button
                type="button"
                onClick={() => void submitRequest()}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0b304b] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    Confirm & Submit
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-10 border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-5 py-7 text-xs text-[#8193a2] sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </div>
      </footer>
    </main>
  );
}
