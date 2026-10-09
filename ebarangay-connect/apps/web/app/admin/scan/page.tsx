
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Camera,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Loader2,
  QrCode,
  ScanLine,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ClaimResult = {
  request_id: number;
  document_name: string | null;
  request_status: string;
  pickup_status: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdminScanPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [verifiedToken, setVerifiedToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const scannerRef = useRef<{
    clear: () => Promise<void>;
  } | null>(null);

  const scanHandledRef = useRef(false);

  // Check administrator access.
  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || profile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setAuthorized(true);
      setCheckingAccess(false);
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (scanner) {
      try {
        await scanner.clear();
      } catch (error) {
        console.warn("Scanner cleanup:", error);
      }
    }

    setScanning(false);
  }, []);

  // Camera scanner setup.
  useEffect(() => {
    if (!scanning || !authorized) return;

    let disposed = false;
    let instance: {
      clear: () => Promise<void>;
      render: (
        onSuccess: (decodedText: string) => void,
        onFailure: (error: string) => void
      ) => void;
    } | null = null;

    async function initializeScanner() {
      try {
        const { Html5QrcodeScanner } = await import(
          "html5-qrcode"
        );

        if (disposed) return;

        const scanner = new Html5QrcodeScanner(
          "admin-qr-reader",
          {
            fps: 10,
            qrbox: {
              width: 220,
              height: 220,
            },
            rememberLastUsedCamera: true,
          },
          false
        );

        instance = scanner;
        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            if (scanHandledRef.current) return;

            scanHandledRef.current = true;

            const value = decodedText.trim();

            setToken(value);
            setResult(null);
            setVerifiedToken("");
            setSuccessMessage("");

            if (!UUID_PATTERN.test(value)) {
              setErrorMessage(
                "The scanned QR does not contain a valid claim token."
              );
            } else {
              setErrorMessage("");
            }

            setScanning(false);
          },
          () => {
            // QR not detected in the current camera frame.
          }
        );
      } catch (error) {
        console.error("Camera error:", error);
        setErrorMessage(
          "Unable to initialize the QR scanner. Check camera permissions."
        );
        setScanning(false);
      }
    }

    initializeScanner();

    return () => {
      disposed = true;

      if (instance) {
        void instance.clear().catch(() => {});
        if (scannerRef.current === instance) {
          scannerRef.current = null;
        }
      }
    };
  }, [scanning, authorized]);

  async function verifyToken(value: string) {
    const cleanedToken = value.trim();

    setErrorMessage("");
    setSuccessMessage("");
    setResult(null);
    setVerifiedToken("");

    if (!UUID_PATTERN.test(cleanedToken)) {
      setErrorMessage(
        "Invalid claim token. Please scan a valid QR code."
      );
      return;
    }

    setVerifying(true);

    try {
      const { data, error } = await supabase.rpc(
        "verify_document_claim",
        { p_token: cleanedToken }
      );

      if (error) {
        setErrorMessage(
          `Verification failed: ${error.message}`
        );
        return;
      }

      const records = data as ClaimResult[] | null;
      const record = records?.[0];

      if (!record) {
        setErrorMessage(
          "No document request matches this QR code."
        );
        return;
      }

      setResult(record);
      setVerifiedToken(cleanedToken);

      if (record.pickup_status === "Claimed") {
        setErrorMessage(
          "This document has already been claimed."
        );
      } else if (
        record.pickup_status !== "Ready for Pickup"
      ) {
        setErrorMessage(
          "This document is not yet eligible for pickup."
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "An unexpected error occurred during verification."
      );
    } finally {
      setVerifying(false);
    }
  }

  async function confirmClaim() {
    if (
      !result ||
      !verifiedToken ||
      result.pickup_status !== "Ready for Pickup"
    ) {
      return;
    }

    setConfirming(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "confirm_document_claim",
        { p_token: verifiedToken }
      );

      if (error) {
        setErrorMessage(
          `Unable to confirm pickup: ${error.message}`
        );
        return;
      }

      const claimedRequestId = Number(data);

      setResult({
        ...result,
        pickup_status: "Claimed",
      });

      setSuccessMessage(
        `Document Request #${claimedRequestId} was successfully marked as claimed.`
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "An unexpected error occurred while confirming pickup."
      );
    } finally {
      setConfirming(false);
    }
  }

  function resetScanner() {
    setToken("");
    setResult(null);
    setVerifiedToken("");
    setErrorMessage("");
    setSuccessMessage("");
    scanHandledRef.current = false;
  }

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5]">
        <div className="text-center">
          <Loader2
            size={32}
            className="mx-auto animate-spin text-[#0b304b]"
          />
          <p className="mt-5 font-bold text-[#0b304b]">
            Checking administrator access...
          </p>
        </div>
      </main>
    );
  }

  if (!authorized) return null;

  const readyToClaim =
    result?.pickup_status === "Ready for Pickup";

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">
      {/* TOP BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7d7e3] sm:text-xs">
            Digital Citizen Services Portal
          </p>
          <p className="hidden text-xs text-[#c7d7e3] sm:block">
            Administrator Access
          </p>
        </div>
      </div>

      {/* HEADER */}
      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
              <Landmark size={23} strokeWidth={1.7} />
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
            href="/admin"
            className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase transition hover:bg-white hover:text-[#0b304b]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">
              Admin Dashboard
            </span>
            <span className="sm:hidden">Back</span>
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
              Document Release Management
            </p>
          </div>

          <h1 className="mt-6 text-4xl font-black sm:text-5xl">
            QR Document Scanner
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
            Verify completed document requests and confirm
            pickup securely using a resident&apos;s QR code.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] hover:text-[#9b7b40]"
        >
         
        </Link>

        {/* ERROR */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-7 flex items-start gap-3 border-l-4 border-[#b74d3d] bg-[#fdf0ed] p-5 text-[#943d31]"
          >
            <XCircle size={22} className="shrink-0" />
            <p className="text-sm leading-7">
              {errorMessage}
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {successMessage && (
          <div
            role="status"
            className="mt-7 flex items-start gap-3 border-l-4 border-[#357c60] bg-[#edf7f1] p-5 text-[#245e48]"
          >
            <CheckCircle2 size={22} className="shrink-0" />
            <p className="text-sm leading-7">
              {successMessage}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-7 lg:grid-cols-2">
          {/* CAMERA SCANNER */}
          <section className="h-fit border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                <Camera size={23} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                  Camera Verification
                </p>
                <h2 className="mt-2 text-xl font-black text-[#0b304b]">
                  Scan Resident QR
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-[#697d8c]">
              Allow camera access, then position the
              resident&apos;s QR code inside the scanning area.
            </p>

            {scanning ? (
              <div className="mt-6">
                <div
                  id="admin-qr-reader"
                  className="min-h-64 w-full overflow-hidden border border-[#dce3e8]"
                />

                <button
                  type="button"
                  onClick={() => {
                    void stopScanner();
                  }}
                  className="mt-5 w-full border border-[#a9473c] px-5 py-3.5 text-sm font-black text-[#a9473c] transition hover:bg-[#fdf0ed]"
                >
                  Stop Scanner
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  resetScanner();
                  scanHandledRef.current = false;
                  setScanning(true);
                }}
                className="mt-7 inline-flex w-full items-center justify-center gap-3 bg-[#0b304b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#174b70]"
              >
                <ScanLine size={19} />
                Start Camera Scanner
              </button>
            )}

            <p className="mt-4 text-xs leading-6 text-[#8193a2]">
              Camera scanning requires browser permission
              and generally works on localhost or HTTPS.
            </p>
          </section>

          {/* MANUAL VERIFICATION */}
          <section className="h-fit border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                <QrCode size={23} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                  Claim Token
                </p>
                <h2 className="mt-2 text-xl font-black text-[#0b304b]">
                  Verify Document
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-[#697d8c]">
              Scan a QR code or enter its claim token
              manually to check the document&apos;s status.
            </p>

            <label
              htmlFor="claim-token"
              className="mt-7 block text-sm font-black text-[#0b304b]"
            >
              Claim Token
            </label>

            <textarea
              id="claim-token"
              rows={3}
              value={token}
              onChange={(event) => {
                setToken(event.target.value);
                setResult(null);
                setVerifiedToken("");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              placeholder="Scan QR or enter claim token..."
              className="mt-3 w-full resize-none border border-[#cdd9e2] bg-[#f8fafc] p-4 text-sm text-[#173149] outline-none focus:border-[#0b304b]"
            />

            <button
              type="button"
              disabled={verifying || confirming || !token.trim()}
              onClick={() => {
                void verifyToken(token);
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#0b304b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Verify Claim QR
                </>
              )}
            </button>
          </section>
        </div>

        {/* VERIFICATION RESULT */}
        {result && (
          <section className="mt-8 border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                  Verification Result
                </p>

                <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                  Request #{result.request_id}
                </h2>

                <p className="mt-3 text-sm text-[#697d8c]">
                  {result.document_name || "Unknown Document"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 px-4 py-2 text-xs font-black ${
                  readyToClaim
                    ? "bg-[#e6f2eb] text-[#28724e]"
                    : "bg-[#eceff1] text-[#566775]"
                }`}
              >
                {readyToClaim ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Ban size={16} />
                )}
                {result.pickup_status}
              </span>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="bg-[#edf2f5] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#718391]">
                  Processing Status
                </p>
                <p className="mt-3 font-black text-[#0b304b]">
                  {result.request_status}
                </p>
              </div>

              <div className="bg-[#edf2f5] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#718391]">
                  Pickup Status
                </p>
                <p className="mt-3 font-black text-[#0b304b]">
                  {result.pickup_status}
                </p>
              </div>
            </div>

            {readyToClaim && (
              <div className="mt-7 border-t border-[#e3e9ee] pt-7">
                <div className="flex items-start gap-3 bg-[#f8f0df] p-5">
                  <ShieldCheck
                    size={21}
                    className="mt-0.5 shrink-0 text-[#9b7b40]"
                  />
                  <p className="text-sm leading-7 text-[#6c592f]">
                    Before confirming, verify the
                    resident&apos;s identity and ensure the
                    correct physical document is ready
                    to be handed over.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => {
                    void confirmClaim();
                  }}
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 bg-[#28724e] px-6 py-4 text-sm font-black text-white transition hover:bg-[#205e40] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirming ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Confirming Pickup...
                    </>
                  ) : (
                    <>
                      <FileCheck2 size={19} />
                      Confirm Document Released
                    </>
                  )}
                </button>
              </div>
            )}

            {result.pickup_status === "Claimed" && (
              <div className="mt-7 flex items-center gap-3 bg-[#edf7f1] p-5 text-[#245e48]">
                <CheckCircle2 size={23} />
                <p className="font-black">
                  This document has already been claimed.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={resetScanner}
              className="mt-5 w-full border border-[#cdd9e2] px-5 py-3.5 text-sm font-black text-[#0b304b] hover:bg-[#edf2f5]"
            >
              Verify Another Document
            </button>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Administrator document release management.</p>
        </div>
      </footer>
    </main>
  );
}
