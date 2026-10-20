
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  ImageIcon,
  Landmark,
  Loader2,
  LogOut,
  Printer,
  Save,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type DocumentType = {
  name: string;
  processing_days: number;
  fee: number;
};

type RequestDetails = {
  id: number;
  profile_id: string;
  status: string | null;
  purpose: string | null;
  document_type_id: number;
  id_image_path: string | null;
  claimed_at: string | null;
  claimed_by: string | null;
  document_types: DocumentType | DocumentType[] | null;
};

type ResidentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  role: string | null;
};

type StatusHistory = {
  id: number;
  status: string;
  remarks: string | null;
  created_at: string | null;
};

type DraftFields = {
  residentName: string;
  residentAddress: string;
  purpose: string;
  barangayName: string;
  cityMunicipality: string;
  province: string;
  additionalStatement: string;
  preparedBy: string;
};

const STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Completed",
  "Rejected",
];

const SUPPORTED_DOCUMENTS = [
  "Barangay Clearance",
  "Certificate of Residency",
  "Certificate of Indigency",
];

const EMPTY_DRAFT: DraftFields = {
  residentName: "",
  residentAddress: "",
  purpose: "",
  barangayName: "",
  cityMunicipality: "",
  province: "",
  additionalStatement: "",
  preparedBy: "",
};

const inputClass =
  "mt-2 w-full rounded-lg border border-[#cdd9e2] bg-white px-4 py-3 text-sm text-[#173149] outline-none focus:border-[#0b304b] focus:ring-2 focus:ring-[#0b304b]/10";

const cardClass =
  "rounded-xl border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8";

function getDocument(
  value: DocumentType | DocumentType[] | null
): DocumentType | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function displayStatus(
  status: string | null,
  claimedAt?: string | null
): string {
  if (claimedAt || status?.toLowerCase() === "claimed") {
    return "Claimed";
  }

  switch (status?.toLowerCase()) {
    case "completed":
    case "ready for claiming":
      return "Ready for Claiming";
    case "approved":
      return "Approved";
    case "processing":
      return "Processing";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "Claimed":
      return "bg-emerald-100 text-emerald-800";
    case "Ready for Claiming":
      return "bg-green-100 text-green-800";
    case "Approved":
      return "bg-teal-100 text-teal-800";
    case "Processing":
      return "bg-blue-100 text-blue-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Cancelled":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function formatDate(value: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export default function AdminRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = Number(params.id);

  const [request, setRequest] = useState<RequestDetails | null>(
    null
  );
  const [resident, setResident] =
    useState<ResidentProfile | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("Pending");
  const [remarks, setRemarks] = useState("");


  const [idImageUrl, setIdImageUrl] =
    useState<string | null>(null);
  const [idImageLoading, setIdImageLoading] =
    useState(false);
  const [idImageError, setIdImageError] = useState("");
  const [idPreviewOpen, setIdPreviewOpen] = useState(false);


  const [draftOpen, setDraftOpen] = useState(false);
  const [draftFields, setDraftFields] =
    useState<DraftFields>(EMPTY_DRAFT);


  async function loadIdImage(path: string) {
    setIdImageLoading(true);
    setIdImageError("");
    setIdImageUrl(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please log in again.");
      }

      const { data: admin, error: adminError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (adminError || admin?.role !== "admin") {
        throw new Error(
          "Only authorized administrators can view submitted IDs."
        );
      }

      const { data, error } = await supabase.storage
        .from("resident-ids")
        .createSignedUrl(path, 300);

      if (error || !data?.signedUrl) {
        throw new Error(
          error?.message ||
            "Unable to retrieve the submitted ID."
        );
      }

      setIdImageUrl(data.signedUrl);
    } catch (error) {
      setIdImageError(
        error instanceof Error
          ? error.message
          : "Unable to load the ID image."
      );
    } finally {
      setIdImageLoading(false);
    }
  }


  useEffect(() => {
    let cancelled = false;

    async function fetchRequest() {
      try {
        if (
          !Number.isInteger(requestId) ||
          requestId <= 0
        ) {
          throw new Error("Invalid request ID.");
        }

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data: admin, error: adminError } =
          await supabase
            .from("profiles")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

        if (cancelled) return;

        if (adminError) {
          throw new Error(adminError.message);
        }

        if (!admin || admin.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        const { data, error } = await supabase
          .from("document_requests")
          .select(`
            id,
            profile_id,
            status,
            purpose,
            document_type_id,
            id_image_path,
            claimed_at,
            claimed_by,
            document_types (
              name,
              processing_days,
              fee
            )
          `)
          .eq("id", requestId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error("Request not found.");
        }

        const loadedRequest = data as RequestDetails;

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, phone_number, address, role"
          )
          .eq("id", loadedRequest.profile_id)
          .maybeSingle();

        if (cancelled) return;

        if (profileError) {
          throw new Error(profileError.message);
        }

        const {
          data: historyData,
          error: historyError,
        } = await supabase
          .from("request_status_history")
          .select("id, status, remarks, created_at")
          .eq("request_id", requestId)
          .order("created_at", { ascending: true });

        if (cancelled) return;

        if (historyError) {
          console.error(
            "History loading error:",
            historyError
          );
        }

        setRequest(loadedRequest);
        setResident(
          (profile as ResidentProfile | null) ?? null
        );
        setHistory(historyData ?? []);
        setSelectedStatus(
          loadedRequest.status || "Pending"
        );

        setDraftFields({
          residentName: profile?.full_name || "",
          residentAddress: profile?.address || "",
          purpose: loadedRequest.purpose || "",
          barangayName: "",
          cityMunicipality: "",
          province: "",
          additionalStatement: "",
          preparedBy: "",
        });


        if (loadedRequest.id_image_path) {
          void loadIdImage(loadedRequest.id_image_path);
        } else {
          setIdImageUrl(null);
          setIdImageError("");
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Request loading error:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the request."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchRequest();

    return () => {
      cancelled = true;
    };

  }, [requestId, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }


  async function handleStatusUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!request || updating) return;

    setUpdateError("");
    setSuccessMessage("");

    const currentDisplayStatus = displayStatus(
      request.status,
      request.claimed_at
    );

    if (
      currentDisplayStatus === "Claimed" ||
      currentDisplayStatus === "Cancelled"
    ) {
      setUpdateError(
        "Claimed or cancelled requests cannot be updated."
      );
      return;
    }

    if (selectedStatus === request.status) {
      setUpdateError(
        "Please select a different request status."
      );
      return;
    }

    if (!STATUS_OPTIONS.includes(selectedStatus)) {
      setUpdateError("Please select a valid status.");
      return;
    }

    setUpdating(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const { data: admin, error: adminError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (adminError || admin?.role !== "admin") {
        throw new Error(
          "You are not authorized to update requests."
        );
      }

      const { data: latest, error: latestError } =
        await supabase
          .from("document_requests")
          .select("id, status, claimed_at")
          .eq("id", request.id)
          .maybeSingle();

      if (latestError) {
        throw new Error(latestError.message);
      }

      if (!latest) {
        throw new Error("Request no longer exists.");
      }

      if (
        latest.claimed_at ||
        ["claimed", "cancelled"].includes(
          (latest.status || "").toLowerCase()
        )
      ) {
        setRequest({
          ...request,
          status: latest.status,
          claimed_at: latest.claimed_at,
        });

        throw new Error(
          "This request has already been claimed or cancelled."
        );
      }

      if (latest.status !== request.status) {
        setRequest({
          ...request,
          status: latest.status,
          claimed_at: latest.claimed_at,
        });

        setSelectedStatus(
          latest.status || "Pending"
        );

        throw new Error(
          "The request changed in another session. Review the updated status."
        );
      }

      const {
        data: updated,
        error: updateErrorResult,
      } = await supabase
        .from("document_requests")
        .update({ status: selectedStatus })
        .eq("id", request.id)
        .eq("status", latest.status)
        .is("claimed_at", null)
        .select("id, status, claimed_at")
        .maybeSingle();

      if (updateErrorResult) {
        throw new Error(updateErrorResult.message);
      }

      if (!updated) {
        throw new Error(
          "The request could not be updated."
        );
      }

      setRequest({
        ...request,
        status: updated.status,
        claimed_at: updated.claimed_at,
      });

      const defaultRemarks: Record<string, string> = {
        Pending: "Request marked as pending.",
        Processing:
          "Request is now being processed.",
        Completed:
          "Document processing completed. Ready for claiming, subject to verification.",
        Rejected: "Request has been rejected.",
      };

      const { error: historyError } = await supabase
        .from("request_status_history")
        .insert({
          request_id: request.id,
          status: selectedStatus,
          remarks:
            remarks.trim() ||
            defaultRemarks[selectedStatus] ||
            "Request status updated.",
        });

      if (historyError) {
        throw new Error(
          "Status updated, but history could not be saved: " +
            historyError.message
        );
      }

      const { data: refreshedHistory } =
        await supabase
          .from("request_status_history")
          .select("id, status, remarks, created_at")
          .eq("request_id", request.id)
          .order("created_at", { ascending: true });

      if (refreshedHistory) {
        setHistory(refreshedHistory);
      }

      setRemarks("");
      setSuccessMessage(
        `Request #${request.id} updated to ${displayStatus(
          selectedStatus
        )}.`
      );
    } catch (error) {
      console.error("Status update error:", error);

      setUpdateError(
        error instanceof Error
          ? error.message
          : "Unable to update request."
      );
    } finally {
      setUpdating(false);
    }
  }

  function updateDraft(
    field: keyof DraftFields,
    value: string
  ) {
    setDraftFields((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handlePrint() {
    if (
      !draftFields.residentName.trim() ||
      !draftFields.residentAddress.trim() ||
      !draftFields.barangayName.trim() ||
      !draftFields.cityMunicipality.trim() ||
      !draftFields.province.trim()
    ) {
      window.alert(
        "Please complete the resident and barangay information before printing."
      );
      return;
    }

    window.print();
  }

  const documentType = request
    ? getDocument(request.document_types)
    : null;

  const documentName = documentType?.name || "";

  const isSupportedDocument =
    SUPPORTED_DOCUMENTS.includes(documentName);

  const currentStatus = request
    ? displayStatus(request.status, request.claimed_at)
    : "Pending";

  const isLocked =
    currentStatus === "Claimed" ||
    currentStatus === "Cancelled";

  const printDate = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5]">
        <div className="text-center text-[#0b304b]">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-[#0b304b]"
          />
          <p className="mt-4 font-bold">
            Loading request details...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !request) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] p-5">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
          <XCircle
            size={36}
            className="mx-auto text-red-600"
          />
          <h1 className="mt-5 text-2xl font-black text-[#0b304b]">
            Unable to Load Request
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            {errorMessage || "Request not found."}
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex rounded-lg bg-[#0b304b] px-6 py-3 font-bold text-white"
          >
            Back to Admin Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d] print:hidden">

        <div className="bg-[#061b2b] text-white">
          <div className="mx-auto flex max-w-7xl justify-between gap-3 px-5 py-3 text-xs sm:px-8">
            <span className="font-bold uppercase tracking-widest">
              Digital Citizen Services Portal
            </span>
            <span className="hidden sm:block">
              Administrator Access
            </span>
          </div>
        </div>


        <header className="bg-[#0b304b] text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <Link
              href="/admin"
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

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 border border-white/30 px-3 py-3 text-xs font-bold transition hover:bg-white/10 sm:px-4"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Admin Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 border border-white/30 px-3 py-3 text-xs font-bold transition hover:bg-white/10 sm:px-4"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </header>


        <section className="relative overflow-hidden bg-[#0b304b] text-white">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage:
                "url('/barangay-hall.jpg')",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#d5bd81]">
              Request #{request.id}
            </p>
            <h1 className="mt-4 text-3xl font-black sm:text-5xl">
              {documentName || "Unknown Document"}
            </h1>
            <p className="mt-4 text-sm leading-7 text-[#d6e1e9]">
              Review resident information, verify the
              submitted ID, manage request status, and
              prepare document drafts.
            </p>
            <span
              className={`mt-6 inline-flex rounded-lg px-4 py-2 text-sm font-bold ${statusColor(
                currentStatus
              )}`}
            >
              {currentStatus}
            </span>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-7 px-5 py-9 sm:px-8">

          {currentStatus === "Claimed" && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  size={23}
                  className="shrink-0 text-emerald-700"
                />
                <div>
                  <h2 className="font-black text-emerald-900">
                    Document Claimed
                  </h2>
                  <p className="mt-2 text-sm text-emerald-800">
                    This request has already been marked
                    as claimed. Further processing changes
                    are disabled.
                  </p>
                  {request.claimed_at && (
                    <p className="mt-3 text-sm font-bold text-emerald-900">
                      Claimed on:{" "}
                      {formatDate(request.claimed_at)}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}


          <section className={cardClass}>
            <div className="flex items-center gap-3 border-b pb-5">
              <UserRound
                size={24}
                className="text-[#0b304b]"
              />
              <div>
                <p className="text-xs font-bold uppercase text-[#9b7b40]">
                  Resident Information
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#0b304b]">
                  Requester Details
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Full Name",
                  value: resident?.full_name,
                },
                {
                  label: "Email",
                  value: resident?.email,
                },
                {
                  label: "Phone Number",
                  value: resident?.phone_number,
                },
                {
                  label: "Address",
                  value: resident?.address,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#dce3e8] bg-[#f8fafc] p-5"
                >
                  <p className="text-xs font-bold uppercase text-[#8193a2]">
                    {item.label}
                  </p>
                  <p className="mt-2 break-word font-bold text-[#173149]">
                    {item.value || "Not provided"}
                  </p>
                </div>
              ))}
            </div>
          </section>


          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
              <div className="flex items-center gap-3">
                <ImageIcon
                  size={24}
                  className="text-[#0b304b]"
                />
                <div>
                  <p className="text-xs font-bold uppercase text-[#9b7b40]">
                    Identity Verification
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#0b304b]">
                    Submitted Valid ID
                  </h2>
                </div>
              </div>

            </div>

            <p className="mt-5 text-sm leading-7 text-[#697d8c]">
              Review the identification document uploaded
              by the resident. The image is retrieved from
              private Supabase Storage using a temporary
              signed URL.
            </p>

            {!request.id_image_path ? (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                No valid ID is linked to this request.
                This may be an older request submitted
                before ID uploads were required.
              </div>
            ) : idImageLoading ? (
              <div className="mt-6 flex items-center justify-center gap-3 rounded-lg bg-[#f8fafc] p-10 text-[#0b304b]">
                <Loader2
                  size={22}
                  className="animate-spin"
                />
                <span className="text-sm font-bold">
                  Loading submitted ID...
                </span>
              </div>
            ) : idImageError ? (
              <div
                role="alert"
                className="mt-6 rounded-lg border border-red-200 bg-red-50 p-5"
              >
                <p className="font-bold text-red-800">
                  Unable to display submitted ID
                </p>
                <p className="mt-2  text-sm text-red-700">
                  {idImageError}
                </p>
                <p className="mt-3 text-xs text-red-700">
                  Check the resident-ids Storage bucket
                  and its admin SELECT policy.
                </p>
              </div>
            ) : idImageUrl ? (
              <div className="mt-6 space-y-5">
                <div className="flex justify-center rounded-lg border border-[#dce3e8] bg-[#f8fafc] p-5">

                  <img
                    src={idImageUrl}
                    alt="Valid ID submitted by resident"
                    className="max-h-110 max-w-full rounded-lg object-contain"
                    onError={() =>
                      setIdImageError(
                        "The ID image could not be displayed. Reload the request details to generate a new temporary link."
                      )
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setIdPreviewOpen(true)
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0b304b] px-5 py-3 text-sm font-bold text-white"
                  >
                    <ImageIcon size={18} />
                    View Submitted ID
                  </button>

                </div>

                <p className="text-xs leading-6 text-[#697d8c]">
                  This secure image link expires after
                  five minutes. Reload the request details
                  to generate a new link.
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-[#697d8c]">
                No image preview is currently available.
              </p>
            )}
          </section>


          <section className={cardClass}>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                  Document Preparation
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#0b304b]">
                  Prepare Document Draft
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#697d8c]">
                  Generate an editable, printable draft
                  using the information submitted by the
                  resident. Staff must verify all details
                  before issuing an official document.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDraftOpen((open) => !open)
                }
                disabled={
                  !resident || !isSupportedDocument
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0b304b] px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50"
              >
                <FileText size={18} />
                {draftOpen
                  ? "Close Draft Editor"
                  : "Prepare Document Draft"}
              </button>
            </div>

            {!isSupportedDocument && (
              <p className="mt-5 text-sm text-amber-800">
                No draft template is available for this
                document type.
              </p>
            )}

            {draftOpen && isSupportedDocument && (
              <div className="mt-8 space-y-7 border-t pt-7">
                <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                  This is a draft preparation tool only.
                  It does not verify eligibility, approve
                  the request, issue a certificate, or
                  apply an official signature or seal.
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {(
                    [
                      [
                        "residentName",
                        "Resident Full Name",
                      ],
                      [
                        "residentAddress",
                        "Resident Address",
                      ],
                      [
                        "barangayName",
                        "Barangay Name",
                      ],
                      [
                        "cityMunicipality",
                        "City / Municipality",
                      ],
                      ["province", "Province"],
                      ["preparedBy", "Prepared By"],
                    ] as const
                  ).map(([field, label]) => (
                    <label
                      key={field}
                      className="block text-sm font-bold text-[#173149]"
                    >
                      {label}
                      <input
                        type="text"
                        value={draftFields[field]}
                        onChange={(event) =>
                          updateDraft(
                            field,
                            event.target.value
                          )
                        }
                        maxLength={200}
                        className={inputClass}
                      />
                    </label>
                  ))}
                </div>

                <label className="block text-sm font-bold text-[#173149]">
                  Purpose
                  <textarea
                    rows={3}
                    value={draftFields.purpose}
                    onChange={(event) =>
                      updateDraft(
                        "purpose",
                        event.target.value
                      )
                    }
                    maxLength={500}
                    className={inputClass}
                  />
                </label>

                <label className="block text-sm font-bold text-[#173149]">
                  Additional Verified Statement
                  <textarea
                    rows={4}
                    value={
                      draftFields.additionalStatement
                    }
                    onChange={(event) =>
                      updateDraft(
                        "additionalStatement",
                        event.target.value
                      )
                    }
                    maxLength={1000}
                    placeholder="Optional. Enter only statements verified and authorized by barangay personnel."
                    className={inputClass}
                  />
                </label>

                <div className="rounded-lg bg-[#f0f4f7] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black text-[#0b304b]">
                        Draft Preview
                      </h3>
                      <p className="mt-1 text-xs text-[#697d8c]">
                        The printable document uses the
                        information above.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0b304b] px-5 py-3 text-sm font-bold text-white"
                    >
                      <Printer size={18} />
                      Print Draft
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-[#dce3e8] p-5 text-sm leading-7 text-[#697d8c]">
                  <strong className="text-[#0b304b]">
                    Reminder:
                  </strong>{" "}
                  This draft is not saved to Supabase.
                  Printing uses the browser print dialog.
                  The editor resets when the page reloads.
                </div>
              </div>
            )}
          </section>


          <section className={cardClass}>
            <div className="flex items-center gap-3 border-b pb-5">
              <ShieldCheck
                size={24}
                className="text-[#0b304b]"
              />
              <div>
                <p className="text-xs font-bold uppercase text-[#9b7b40]">
                  Admin Controls
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#0b304b]">
                  Update Request Status
                </h2>
              </div>
            </div>

            {successMessage && (
              <div
                role="status"
                className="mt-5 flex gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-800"
              >
                <CheckCircle2 size={20} />
                {successMessage}
              </div>
            )}

            {updateError && (
              <div
                role="alert"
                className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-800"
              >
                {updateError}
              </div>
            )}

            {isLocked ? (
              <p className="mt-6 rounded-lg bg-gray-100 p-5 text-sm">
                This request is{" "}
                {currentStatus.toLowerCase()}.
                Its processing status cannot be changed.
              </p>
            ) : (
              <form
                onSubmit={handleStatusUpdate}
                className="mt-6 space-y-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-bold">
                    New Status
                    <select
                      value={selectedStatus}
                      onChange={(event) => {
                        setSelectedStatus(
                          event.target.value
                        );
                        setUpdateError("");
                      }}
                      disabled={updating}
                      className={inputClass}
                    >
                      {!STATUS_OPTIONS.includes(
                        selectedStatus
                      ) && (
                        <option
                          value={selectedStatus}
                          disabled
                        >
                          {displayStatus(
                            selectedStatus
                          )}
                        </option>
                      )}

                      {STATUS_OPTIONS.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {displayStatus(status)}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="block text-sm font-bold">
                    Remarks
                    <textarea
                      rows={4}
                      value={remarks}
                      onChange={(event) =>
                        setRemarks(
                          event.target.value
                        )
                      }
                      disabled={updating}
                      maxLength={1000}
                      placeholder="Add remarks for the resident..."
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-[#f0f4f7] p-5">
                  <p className="text-sm">
                    Current status:{" "}
                    <strong>
                      {currentStatus}
                    </strong>
                  </p>

                  <button
                    type="submit"
                    disabled={
                      updating ||
                      selectedStatus ===
                        request.status ||
                      !STATUS_OPTIONS.includes(
                        selectedStatus
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0b304b] px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {updating ? (
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={18} />
                    )}
                    Update Status
                  </button>
                </div>
              </form>
            )}
          </section>


          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
            <section className={cardClass}>
              <div className="flex items-center gap-3 border-b pb-5">
                <FileText
                  size={23}
                  className="text-[#0b304b]"
                />
                <h2 className="text-xl font-black text-[#0b304b]">
                  Document Details
                </h2>
              </div>

              <dl className="mt-6 space-y-5">
                {[
                  [
                    "Request ID",
                    `#${request.id}`,
                  ],
                  [
                    "Document Type",
                    documentName,
                  ],
                  [
                    "Processing Time",
                    `${
                      documentType?.processing_days ??
                      0
                    } day(s)`,
                  ],
                  [
                    "Document Fee",
                    `₱${Number(
                      documentType?.fee ?? 0
                    ).toFixed(2)}`,
                  ],
                  [
                    "Current Status",
                    currentStatus,
                  ],
                  [
                    "Claimed At",
                    request.claimed_at
                      ? formatDate(
                          request.claimed_at
                        )
                      : "Not yet claimed",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="border-b border-[#edf1f4] pb-4"
                  >
                    <dt className="text-xs font-bold uppercase text-[#8193a2]">
                      {label}
                    </dt>
                    <dd className="mt-2 font-bold text-[#0b304b]">
                      {value}
                    </dd>
                  </div>
                ))}

                <div>
                  <dt className="text-xs font-bold uppercase text-[#8193a2]">
                    Purpose
                  </dt>
                  <dd className="mt-2 whitespace-pre-wrap break-word text-sm leading-7">
                    {request.purpose ||
                      "No purpose provided."}
                  </dd>
                </div>
              </dl>
            </section>

            <section className={cardClass}>
              <div className="flex items-center gap-3 border-b pb-5">
                <Clock3
                  size={23}
                  className="text-[#0b304b]"
                />
                <h2 className="text-xl font-black text-[#0b304b]">
                  Status History
                </h2>
              </div>

              {history.length === 0 ? (
                <p className="mt-6 text-sm text-[#697d8c]">
                  No status history is available.
                </p>
              ) : (
                <ol className="mt-6 space-y-5">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="border-l-2 border-[#d5bd81] pl-4"
                    >
                      <span
                        className={`inline-block rounded px-3 py-1 text-xs font-bold ${statusColor(
                          displayStatus(
                            item.status
                          )
                        )}`}
                      >
                        {displayStatus(
                          item.status
                        )}
                      </span>

                      <p className="mt-2 text-xs text-[#8193a2]">
                        {formatDate(
                          item.created_at
                        )}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-word text-sm leading-6 text-[#697d8c]">
                        {item.remarks ||
                          "No remarks provided."}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

        </div>

        <footer className="mt-12 border-t bg-white px-5 py-7 text-center text-xs text-[#8193a2]">
          © 2026 eBarangay Connect — Administrator Portal
        </footer>
      </main>


      {idPreviewOpen && idImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 print:hidden"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Submitted valid ID preview"
            className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
              <div>
                <h2 className="font-black text-[#0b304b]">
                  Submitted Valid ID
                </h2>
                <p className="text-xs text-[#697d8c]">
                  Request #{request.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIdPreviewOpen(false)
                }
                aria-label="Close ID preview"
                className="rounded-lg p-2 text-[#0b304b] hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#eef2f5] p-4 sm:p-6">

              <img
                src={idImageUrl}
                alt="Full-size submitted valid ID"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </section>
        </div>
      )}


      {draftOpen && isSupportedDocument && (
        <article className="hidden bg-white text-black print:block">
          <style>{`
            @page {
              size: A4 portrait;
              margin: 18mm;
            }

            @media print {
              body {
                background: white !important;
              }

              .draft-paper {
                font-family: "Times New Roman", serif;
                font-size: 12pt;
                line-height: 1.65;
              }

              .draft-paper p {
                margin: 0 0 14px;
              }
            }
          `}</style>

          <div className="draft-paper mx-auto max-w-[175mm]">

            <div className="border-b-2 border-black pb-5 text-center">
              <p>Republic of the Philippines</p>
              <p>
                Province of{" "}
                {draftFields.province}
              </p>
              <p>
                City / Municipality of{" "}
                {draftFields.cityMunicipality}
              </p>
              <p className="font-bold">
                BARANGAY{" "}
                {draftFields.barangayName.toUpperCase()}
              </p>
              <p>
                OFFICE OF THE PUNONG BARANGAY
              </p>
            </div>


            <div className="mt-6 text-center">
              <p className="text-lg font-bold uppercase underline">
                {documentName}
              </p>
              <p className="mt-2 text-xs font-bold uppercase">
                Draft — For Staff Review Only
              </p>
            </div>


            <div className="mt-10">
              <p>TO WHOM IT MAY CONCERN:</p>

              {documentName ===
                "Barangay Clearance" && (
                <>
                  <p>
                    This draft concerns the request
                    of{" "}
                    <strong>
                      {draftFields.residentName}
                    </strong>
                    , whose address is recorded as{" "}
                    <strong>
                      {draftFields.residentAddress}
                    </strong>
                    .
                  </p>

                  <p>
                    The request is for the following
                    purpose:{" "}
                    <strong>
                      {draftFields.purpose}
                    </strong>
                    .
                  </p>

                  <p>
                    Any statement concerning clearance
                    eligibility, official records, or
                    good standing must be verified and
                    authorized by barangay personnel
                    before the document is finalized.
                  </p>
                </>
              )}

              {documentName ===
                "Certificate of Residency" && (
                <>
                  <p>
                    This draft concerns the residency
                    certification request of{" "}
                    <strong>
                      {draftFields.residentName}
                    </strong>
                    .
                  </p>

                  <p>
                    The resident&apos;s submitted
                    address is{" "}
                    <strong>
                      {draftFields.residentAddress}
                    </strong>
                    .
                  </p>

                  <p>
                    The stated purpose of the request
                    is{" "}
                    <strong>
                      {draftFields.purpose}
                    </strong>
                    . Residency must be independently
                    verified by authorized barangay
                    personnel before certification.
                  </p>
                </>
              )}

              {documentName ===
                "Certificate of Indigency" && (
                <>
                  <p>
                    This draft concerns the request
                    for a Certificate of Indigency
                    submitted by{" "}
                    <strong>
                      {draftFields.residentName}
                    </strong>
                    .
                  </p>

                  <p>
                    The submitted address is{" "}
                    <strong>
                      {draftFields.residentAddress}
                    </strong>
                    .
                  </p>

                  <p>
                    The stated purpose is{" "}
                    <strong>
                      {draftFields.purpose}
                    </strong>
                    . Eligibility for an indigency
                    certification must be verified
                    and authorized by barangay
                    personnel before issuance.
                  </p>
                </>
              )}

              {draftFields.additionalStatement.trim() && (
                <p className="whitespace-pre-wrap">
                  {draftFields.additionalStatement}
                </p>
              )}

              <p>
                Prepared for staff review on{" "}
                {printDate}.
              </p>
            </div>


            <div className="mt-16">
              <p>
                Prepared by:{" "}
                {draftFields.preparedBy ||
                  "________________"}
              </p>

              <p>
                Request Reference: #{request.id}
              </p>

              <div className="mt-14 text-center">
                <p>
                  ______________________________
                </p>
                <p>
                  Authorized Barangay Official
                </p>
                <p className="text-xs">
                  Signature and official stamp
                  to be completed manually
                  after verification.
                </p>
              </div>
            </div>


            <div className="mt-12 border-t pt-3 text-center text-xs">
              DRAFT ONLY — NOT AN OFFICIALLY
              ISSUED DOCUMENT
            </div>
          </div>
        </article>
      )}
    </>
  );
}
