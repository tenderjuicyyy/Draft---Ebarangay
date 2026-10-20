
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Camera,
  CameraOff,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Loader2,
  QrCode,
  RotateCcw,
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

type ScannerInstance = {
  start: (
    camera: { facingMode: string },
    config: {
      fps: number;
      qrbox: (width: number, height: number) => {
        width: number;
        height: number;
      };
    },
    onSuccess: (decodedText: string) => void,
    onError?: (message: string) => void
  ) => Promise<unknown>;
  stop: () => Promise<void>;
  clear: () => void;
  isScanning: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractToken(value: string) {
  const trimmed = value.trim();

  if (UUID_PATTERN.test(trimmed)) {
    return trimmed;
  }



  return "";
}

function cameraErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error);

  if (
    /notallowed|permission|denied|permissiondismissed/i.test(
      message
    )
  ) {
    return "Camera permission was denied. Allow camera access in your browser settings and try again.";
  }

  if (/notfound|no camera|devicesnotfound/i.test(message)) {
    return "No camera was detected. Connect a camera or use a phone with a working camera.";
  }

  if (/notreadable|trackstarterror|could not start/i.test(message)) {
    return "The camera is being used by another application or could not be started. Close other camera apps and try again.";
  }

  if (/overconstrained/i.test(message)) {
    return "The requested camera is unavailable on this device.";
  }

  return (
    "Unable to start the camera. Make sure camera permission is enabled " +
    "and the page is opened using HTTPS or localhost."
  );
}

export default function AdminScanPage() {
  const router = useRouter();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [token, setToken] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);

  const [scanning, setScanning] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const scannerRef = useRef<ScannerInstance | null>(null);
  const scanHandledRef = useRef(false);
  const verificationCounterRef = useRef(0);
  const confirmingRef = useRef(false);


  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
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

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          throw new Error(error.message);
        }

        if (profile?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setAuthorized(true);
      } catch (error) {
        if (cancelled) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify administrator access."
        );
      } finally {
        if (!cancelled) {
          setCheckingAccess(false);
        }
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);


  useEffect(() => {
    if (!scanning || !authorized) return;

    let disposed = false;
    let localScanner: ScannerInstance | null = null;

    async function startCamera() {
      try {
        if (
          !window.isSecureContext ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error(
            "Camera requires HTTPS or localhost."
          );
        }

        const { Html5Qrcode } = await import("html5-qrcode");

        if (disposed) return;

        const scanner = new Html5Qrcode(
          "admin-qr-reader",
          {
            verbose: false,
          }
        ) as ScannerInstance;

        localScanner = scanner;
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.max(
                100,
                Math.min(240, width - 24, height - 24)
              );

              return {
                width: size,
                height: size,
              };
            },
          },
          (decodedText) => {
            if (disposed || scanHandledRef.current) {
              return;
            }

            scanHandledRef.current = true;

            const scannedValue = decodedText.trim();
            const cleanedToken = extractToken(scannedValue);

            verificationCounterRef.current += 1;

            setToken(scannedValue);
            setResult(null);
            setVerifiedToken("");
            setSuccessMessage("");

            if (!cleanedToken) {
              setErrorMessage(
                "The scanned QR code does not contain a valid UUID claim token."
              );
            } else {
              setErrorMessage("");
            }


            setScanning(false);
          },
          () => {

          }
        );

        if (disposed) return;

        setCameraStarting(false);
      } catch (error) {
        if (disposed) return;

        console.error("Camera initialization error:", error);

        setCameraStarting(false);
        setErrorMessage(cameraErrorMessage(error));
        setScanning(false);
      }
    }

    void startCamera();

    return () => {
      disposed = true;

      const scanner = localScanner;

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }

      if (scanner) {
        void (async () => {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (error) {
            console.warn("Camera stop warning:", error);
          }

          try {
            scanner.clear();
          } catch (error) {
            console.warn("Camera cleanup warning:", error);
          }
        })();
      }
    };
  }, [scanning, authorized]);

  function resetVerification() {
    verificationCounterRef.current += 1;

    setToken("");
    setResult(null);
    setVerifiedToken("");
    setErrorMessage("");
    setSuccessMessage("");
    scanHandledRef.current = false;
  }

  function startScanner() {
    if (scanning || verifying || confirming) return;

    resetVerification();
    setCameraStarting(true);
    setScanning(true);
  }

  function stopScanner() {
    setScanning(false);
    setCameraStarting(false);
  }

  function handleTokenChange(value: string) {
    verificationCounterRef.current += 1;

    setToken(value);
    setResult(null);
    setVerifiedToken("");
    setErrorMessage("");
    setSuccessMessage("");
  }


  async function verifyToken() {
    if (!authorized || verifying || confirming) return;

    const cleanedToken = extractToken(token);

    verificationCounterRef.current += 1;
    const verificationId = verificationCounterRef.current;

    setResult(null);
    setVerifiedToken("");
    setErrorMessage("");
    setSuccessMessage("");

    if (!cleanedToken) {
      setErrorMessage(
        "Invalid claim token. Enter or scan the UUID provided in the resident's QR code."
      );
      return;
    }

    setVerifying(true);

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

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError || profile?.role !== "admin") {
        throw new Error(
          "Only authorized administrators can verify claims."
        );
      }

      const { data, error } = await supabase.rpc(
        "verify_document_claim",
        { p_token: cleanedToken }
      );

      if (verificationId !== verificationCounterRef.current) {
        return;
      }

      if (error) {
        throw new Error(`Verification failed: ${error.message}`);
      }

      const records = data as ClaimResult[] | null;
      const record = records?.[0];

      if (!record) {
        throw new Error(
          "No document request matches this QR code."
        );
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
      if (verificationId !== verificationCounterRef.current) {
        return;
      }

      console.error("QR verification error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during verification."
      );
    } finally {
      setVerifying(false);
    }
  }


  async function confirmClaim() {
    if (
      !authorized ||
      !result ||
      !verifiedToken ||
      result.pickup_status !== "Ready for Pickup" ||
      confirmingRef.current
    ) {
      return;
    }

    confirmingRef.current = true;
    setConfirming(true);
    setErrorMessage("");
    setSuccessMessage("");

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

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError || profile?.role !== "admin") {
        throw new Error(
          "You are not authorized to release documents."
        );
      }

      const { data, error } = await supabase.rpc(
        "confirm_document_claim",
        { p_token: verifiedToken }
      );

      if (error) {
        throw new Error(
          `Unable to confirm pickup: ${error.message}`
        );
      }

      const claimedRequestId = Number(data);

      setResult((current) =>
        current
          ? {
              ...current,
              pickup_status: "Claimed",
            }
          : current
      );

      setSuccessMessage(
        `Document Request #${
          Number.isFinite(claimedRequestId)
            ? claimedRequestId
            : result.request_id
        } was successfully marked as claimed.`
      );
    } catch (error) {
      console.error("Claim confirmation error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while confirming pickup."
      );
    } finally {
      confirmingRef.current = false;
      setConfirming(false);
    }
  }

  const readyToClaim =
    result?.pickup_status === "Ready for Pickup";

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5]">
        <div className="text-center">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-[#0b304b]"
          />

          <p className="mt-5 font-bold text-[#0b304b]">
            Checking administrator access...
          </p>
        </div>
      </main>
    );
  }

  if (!authorized && !errorMessage) {
    return null;
  }

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef2f5] px-5">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <XCircle
            size={32}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-4 text-xl font-black text-[#0b304b]">
            Access Unavailable
          </h1>

          <p className="mt-3 text-sm text-red-700">
            {errorMessage}
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-lg bg-[#0b304b] px-5 py-3 text-sm font-bold text-white"
          >
            Return to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#eef2f5] font-sans text-[#172b3d]">

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


      <header className="bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
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
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-3 text-xs font-bold transition hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">
              Admin Dashboard
            </span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>


      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
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

          <p className="mt-5 max-w-2xl text-sm leading-8 text-[#d6e1e9]">
            Scan and verify a resident&apos;s document
            claim QR code before confirming its release.
          </p>
        </div>
      </section>


      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0b304b] hover:text-[#9b7b40]"
        >


        </Link>

        {errorMessage && (
          <div
            role="alert"
            className="mt-7 flex items-start gap-3 rounded-lg border-l-4 border-[#b74d3d] bg-[#fdf0ed] p-5 text-[#943d31]"
          >
            <XCircle size={22} className="shrink-0" />
            <p className="text-sm leading-7">
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mt-7 flex items-start gap-3 rounded-lg border-l-4 border-[#357c60] bg-[#edf7f1] p-5 text-[#245e48]"
          >
            <CheckCircle2
              size={22}
              className="shrink-0"
            />
            <p className="text-sm leading-7">
              {successMessage}
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-7 lg:grid-cols-2">

          <section className="h-fit rounded-xl border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8eef3] text-[#0b304b]">
                <Camera size={23} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                  Camera Verification
                </p>

                <h2 className="mt-2 text-xl font-black text-[#0b304b]">
                  Scan Resident QR
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-[#697d8c]">
              Allow camera access and point the camera at
              the resident&apos;s QR code. The scanner
              will stop automatically after reading it.
            </p>

            {scanning ? (
              <div className="mt-6">
                <div className="overflow-hidden rounded-xl border border-[#dce3e8] bg-[#061b2b]">
                  <div
                    id="admin-qr-reader"
                    className="min-h-64 w-full"
                  />
                </div>

                {cameraStarting && (
                  <p
                    role="status"
                    className="mt-4 flex items-center justify-center gap-2 text-sm text-[#697d8c]"
                  >
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Starting camera...
                  </p>
                )}

                <button
                  type="button"
                  onClick={stopScanner}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#a9473c] px-5 py-3.5 text-sm font-black text-[#a9473c] hover:bg-[#fdf0ed]"
                >
                  <CameraOff size={18} />
                  Stop Scanner
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startScanner}
                disabled={verifying || confirming}
                className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#0b304b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#174b70] disabled:opacity-50"
              >
                <ScanLine size={19} />
                Start Camera Scanner
              </button>
            )}

            <p className="mt-4 text-xs leading-6 text-[#8193a2]">
              Use HTTPS for your deployed website.
              Localhost also supports camera access.
              Allow camera permission when prompted.
            </p>
          </section>


          <section className="h-fit rounded-xl border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8eef3] text-[#0b304b]">
                <QrCode size={23} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                  Claim Token
                </p>

                <h2 className="mt-2 text-xl font-black text-[#0b304b]">
                  Verify Document
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-[#697d8c]">
              Scan the resident&apos;s QR code or enter
              the claim token manually to check its
              status.
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
              onChange={(event) =>
                handleTokenChange(event.target.value)
              }
              disabled={scanning || verifying || confirming}
              placeholder="Scan QR or enter claim token..."
              className="mt-3 w-full resize-none rounded-lg border border-[#cdd9e2] bg-[#f8fafc] p-4 text-sm text-[#173149] outline-none focus:border-[#0b304b] disabled:opacity-60"
            />

            <button
              type="button"
              disabled={
                scanning ||
                verifying ||
                confirming ||
                !token.trim()
              }
              onClick={() => void verifyToken()}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0b304b] px-6 py-4 text-sm font-black text-white transition hover:bg-[#174b70] disabled:cursor-not-allowed disabled:opacity-50"
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


        {result && (
          <section className="mt-8 rounded-xl border border-[#dce3e8] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9b7b40]">
                  Verification Result
                </p>

                <h2 className="mt-3 text-2xl font-black text-[#0b304b]">
                  Request #{result.request_id}
                </h2>

                <p className="mt-3 text-sm text-[#697d8c]">
                  {result.document_name ||
                    "Unknown Document"}
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-xs font-black ${
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
              <div className="rounded-lg bg-[#edf2f5] p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#718391]">
                  Processing Status
                </p>

                <p className="mt-3 font-black text-[#0b304b]">
                  {result.request_status}
                </p>
              </div>

              <div className="rounded-lg bg-[#edf2f5] p-5">
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
                <div className="flex items-start gap-3 rounded-lg bg-[#f8f0df] p-5">
                  <ShieldCheck
                    size={21}
                    className="mt-0.5 shrink-0 text-[#9b7b40]"
                  />

                  <p className="text-sm leading-7 text-[#6c592f]">
                    Before confirming release, check the
                    resident&apos;s identity and ensure
                    the correct physical document is
                    ready to be handed over.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={confirming || verifying}
                  onClick={() => void confirmClaim()}
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-[#28724e] px-6 py-4 text-sm font-black text-white transition hover:bg-[#205e40] disabled:opacity-50"
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
              <div className="mt-7 flex items-center gap-3 rounded-lg bg-[#edf7f1] p-5 text-[#245e48]">
                <CheckCircle2 size={23} />
                <p className="font-black">
                  This document has already been claimed.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={resetVerification}
              disabled={confirming}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#cdd9e2] px-5 py-3.5 text-sm font-black text-[#0b304b] hover:bg-[#edf2f5] disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Verify Another Document
            </button>
          </section>
        )}
      </div>


      <footer className="mt-12 border-t border-[#dce3e8] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Administrator document release management.</p>
        </div>
      </footer>
    </main>
  );
}
