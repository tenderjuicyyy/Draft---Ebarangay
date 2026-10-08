
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  FileCheck2,
  FileText,
  Info,
  Landmark,
  PhilippinePeso,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const requirementsByDocument: Record<string, string[]> = {
  "barangay clearance": [
    "Valid ID",
    "Completed application information",
    "Purpose of request",
  ],
  "certificate of residency": [
    "Valid ID",
    "Complete residential address",
    "Purpose of request",
  ],
  "certificate of indigency": [
    "Valid ID",
    "Completed application information",
    "Purpose of request",
  ],
};

function getRequirements(name: string): string[] {
  return requirementsByDocument[name.trim().toLowerCase()] ?? [];
}

export default async function DocumentsPage() {
  const { data: documents, error } = await supabase
    .from("document_types")
    .select("*")
    .eq("is_active", true)
    .order("id");

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
          <Link href="/" className="flex items-center gap-4">
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
            href="/"
            className="inline-flex items-center gap-2 border border-white/30 px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition hover:bg-white hover:text-[#0b304b]"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#102f48] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-75"
          style={{ backgroundImage: "url('/barangay-hall.jpg')" }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#061b2b]/95 via-[#0b304b]/90 to-[#0b304b]/75" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#d5bd81]" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e2c991]">
              Document Services
            </p>
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Available Barangay
            <br />
            Documents
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-8 text-[#d6e1e9] sm:text-base">
            Explore available barangay documents, review their requirements,
            processing times and fees, and prepare for your online request.
          </p>

          <div className="mt-9 flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
              <FileText size={18} className="text-[#e2c991]" />
              Online Requests
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
              <Clock3 size={18} className="text-[#e2c991]" />
              Processing Information
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#d6e1e9]">
              <ShieldCheck size={18} className="text-[#e2c991]" />
              Guided Requirements
            </div>
          </div>
        </div>
      </section>

      {/* DOCUMENT LIST */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
              Barangay Services
            </p>
            <h2 className="mt-3 text-2xl font-black text-[#0b304b] sm:text-3xl">
              Browse Available Documents
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#697d8c]">
              Check each document&apos;s requirements and details before
              submitting your request.
            </p>
          </div>

          {!error && (
            <div className="w-fit border border-[#dce3e8] bg-white px-5 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#718391]">
                Available Services
              </p>
              <p className="mt-1 text-2xl font-black text-[#0b304b]">
                {documents?.length ?? 0}
              </p>
            </div>
          )}
        </div>

        {error ? (
          <div
            role="alert"
            className="border-l-4 border-[#b74d3d] bg-[#fdf0ed] px-6 py-5"
          >
            <p className="font-bold text-[#943d31]">
              Failed to load documents
            </p>
            <p className="mt-2 text-sm text-[#943d31]">
              Please try again later.
            </p>
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((document) => {
              const requirements = getRequirements(document.name);

              return (
                <article
                  key={document.id}
                  className="group flex h-full flex-col border border-[#dce3e8] bg-white p-7 shadow-sm transition hover:border-[#aabcc9] hover:shadow-lg"
                >
                  <div className="flex h-14 w-14 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                    <FileText size={25} />
                  </div>

                  <h3 className="mt-7 text-xl font-black leading-snug text-[#0b304b]">
                    {document.name}
                  </h3>

                  <p className="mt-4 flex-1 text-sm leading-7 text-[#697d8c]">
                    {document.description}
                  </p>

                  {/* GUIDED REQUIREMENTS */}
                  {requirements.length > 0 && (
                    <div className="mt-7 border border-[#dce3e8] bg-[#f8fafc] p-5">
                      <div className="flex items-center gap-2">
                        <FileCheck2 size={18} className="text-[#9b7b40]" />
                        <h4 className="text-xs font-black uppercase tracking-wide text-[#0b304b]">
                          Document Requirements
                        </h4>
                      </div>

                      <p className="mt-3 text-xs leading-6 text-[#697d8c]">
                        Prepare the following before submitting your request:
                      </p>

                      <ul className="mt-4 space-y-3">
                        {requirements.map((requirement) => (
                          <li
                            key={requirement}
                            className="flex items-start gap-3"
                          >
                            <CheckCircle2
                              size={17}
                              className="mt-0.5 shrink-0 text-[#357c60]"
                            />
                            <span className="text-sm leading-6 text-[#173149]">
                              {requirement}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* DOCUMENT INFORMATION */}
                  <div className="mt-8 border-t border-[#e3e9ee] pt-6">
                    <div className="flex items-center gap-2">
                      <Info size={17} className="text-[#9b7b40]" />
                      <p className="text-xs font-black uppercase tracking-wide text-[#0b304b]">
                        Document Information
                      </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                          <Clock3 size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#718391]">
                            Processing Time
                          </p>
                          <p className="mt-1 text-sm font-black text-[#0b304b]">
                            {document.processing_days}{" "}
                            {document.processing_days === 1 ? "day" : "days"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f8f0df] text-[#9b7b40]">
                          <PhilippinePeso size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#718391]">
                            Document Fee
                          </p>
                          <p className="mt-1 text-sm font-black text-[#0b304b]">
                            {Number(document.fee) === 0
                              ? "Free"
                              : `₱${Number(document.fee).toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="mt-8 flex items-center justify-center gap-3 bg-[#0b304b] px-5 py-4 text-sm font-black text-white transition hover:bg-[#174b70]"
                  >
                    Request Document
                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border border-[#dce3e8] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
              <FileCheck2 size={27} />
            </div>
            <h3 className="mt-6 text-xl font-black text-[#0b304b]">
              No documents available
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#697d8c]">
              There are currently no active barangay documents available
              for online requests.
            </p>
          </div>
        )}
      </section>

      {/* INFORMATION BANNER */}
      <section className="bg-[#0b304b] text-white">
        <div className="mx-auto max-w-7xl flex-col justify-between gap-6 px-5 py-10 sm:flex sm:px-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e2c991]">
              eBarangay Connect
            </p>
            <h2 className="mt-3 text-2xl font-black">
              Ready to request a document?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c7d7e3]">
              Sign in to your resident account to submit and track your
              barangay document requests.
            </p>
          </div>

          <Link
            href="/login"
            className="mt-6 inline-flex shrink-0 items-center justify-center gap-3 bg-[#d5bd81] px-6 py-4 text-sm font-black text-[#0b304b] transition hover:bg-white lg:mt-0"
          >
            Sign In to Continue
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#e3e9ee] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-7 text-xs text-[#8193a2] sm:flex-row sm:items-center sm:px-8">
          <p>© 2026 eBarangay Connect</p>
          <p>Digital barangay services for residents.</p>
        </div>
      </footer>
    </main>
  );
}
