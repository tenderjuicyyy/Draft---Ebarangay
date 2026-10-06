"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
} from "lucide-react";

const services = [
  {
    category: "CLEARANCE",
    title: "Barangay Clearance",
    price: "₱50",
    description:
      "A document commonly used for employment, applications, transactions, and other official purposes.",
    processing: "1 day",
  },
  {
    category: "CERTIFICATION",
    title: "Certificate of Indigency",
    price: "FREE",
    description:
      "A certification for qualified residents who need proof of financial or economic status.",
    processing: "1 day",
  },
  {
    category: "CERTIFICATION",
    title: "Certificate of Residency",
    price: "₱30",
    description:
      "Certifies that an individual is a resident of the barangay for official or personal transactions.",
    processing: "3 days",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* GOVERNMENT BAR */}
      <div className="bg-[#0b1226] px-4 py-2 text-xs text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#f5c542]">
              REPUBLIC OF THE PHILIPPINES
            </span>

            <span className="hidden text-slate-500 sm:inline">
              •
            </span>

            <span className="hidden sm:inline">
              Barangay San Dok
            </span>
          </div>

          <span className="hidden text-slate-300 md:block">
            Digital Citizen Services Portal
          </span>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* LOGO */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b1226] text-white">
              <span className="text-lg">🏛️</span>
            </div>

            <div>
              <div className="text-lg font-extrabold tracking-tight sm:text-xl">
                eBarangay
                <span className="text-[#1264ff]">
                  Connect
                </span>
              </div>

              <p className="hidden text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:block">
                Digital Citizen Portal
              </p>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-7 md:flex">
            <a
              href="#services"
              className="text-sm font-medium text-slate-600 transition hover:text-[#1264ff]"
            >
              Services
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-[#1264ff]"
            >
              How It Works
            </a>

            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 transition hover:text-[#1264ff]"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-[#1264ff] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d54dc]"
            >
              Create Account
            </Link>
          </div>

          {/* MOBILE LOGIN */}
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 md:hidden"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-4 pt-6 sm:px-6">
        <div
          className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#101a31] bg-cover bg-center shadow-xl"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(5,13,31,.98) 0%, rgba(7,16,36,.92) 45%, rgba(7,16,36,.58) 75%, rgba(7,16,36,.35) 100%), url('/barangay-hall.jpg')",
          }}
        >
          <div className="px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
            <div className="max-w-3xl text-white">
              {/* BADGE */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Official Digital Citizen Portal
              </div>

              {/* HEADING */}
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Barangay services,
                <br />
                made simpler.
              </h1>

              {/* DESCRIPTION */}
              <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                eBarangayConnect lets residents submit barangay
                document requests online, monitor their request
                status, and manage their transactions in one
                convenient portal.
              </p>

              {/* BUTTONS */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1264ff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d54dc]"
                >
                  Get Started
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Sign In
                </Link>
              </div>

              {/* TRUST POINTS */}
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <FileText size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold">
                      Online Requests
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Submit digitally
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Clock3 size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold">
                      Status Updates
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Track your request
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <ShieldCheck size={17} />
                  </div>

                  <div>
                    <p className="text-xs font-bold">
                      Secure Access
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Account-based portal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/requests/new"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1264ff]">
                <FileText size={21} />
              </div>

              <ArrowRight
                size={18}
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1264ff]"
              />
            </div>

            <h2 className="mt-4 text-base font-bold">
              Request a Document
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Submit a new barangay document request online.
            </p>
          </Link>

          <Link
            href="/requests"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock3 size={21} />
              </div>

              <ArrowRight
                size={18}
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1264ff]"
              />
            </div>

            <h2 className="mt-4 text-base font-bold">
              My Requests
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              View your submitted requests and their current status.
            </p>
          </Link>

          <Link
            href="/login"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldCheck size={21} />
              </div>

              <ArrowRight
                size={18}
                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#1264ff]"
              />
            </div>

            <h2 className="mt-4 text-base font-bold">
              Resident Account
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Sign in to access your personalized dashboard.
            </p>
          </Link>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#1264ff]">
                Document Services
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Available Barangay Documents
              </h2>

              <p className="mt-2 max-w-xl text-sm text-slate-500">
                Choose a document and submit your request through
                your resident account.
              </p>
            </div>

            <Link
              href="/requests/new"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#1264ff] hover:underline"
            >
              Start a request
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] font-bold tracking-widest text-[#1264ff]">
                    {service.category}
                  </span>

                  <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm">
                    {service.price}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  {service.title}
                </h3>

                <p className="mt-2 min-h-16 text-xs leading-5 text-slate-500">
                  {service.description}
                </p>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Processing time
                    </span>

                    <span className="text-xs font-bold text-slate-800">
                      {service.processing}
                    </span>
                  </div>
                </div>

                <Link
                  href="/requests/new"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#0b1226] py-3 text-xs font-bold text-white transition hover:bg-[#1264ff]"
                >
                  Request Document
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6"
      >
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#1264ff]">
            Simple Process
          </p>

          <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            How eBarangayConnect works
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Requesting a barangay document only takes a few simple
            steps.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-[#1264ff]">
              01
            </div>

            <h3 className="mt-4 font-bold">
              Create an Account
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Register as a resident and access your personal
              dashboard.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-[#1264ff]">
              02
            </div>

            <h3 className="mt-4 font-bold">
              Submit Your Request
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Select the document you need and provide its purpose.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-extrabold text-[#1264ff]">
              03
            </div>

            <h3 className="mt-4 font-bold">
              Track the Status
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Monitor whether your request is pending, processing,
              completed, or rejected.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#0b1226] px-6 py-12 text-center text-white sm:px-10">
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <CheckCircle2 size={23} />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold sm:text-3xl">
              Ready to request a document?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Create your resident account and manage your barangay
              document requests online.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1264ff] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0d54dc]"
              >
                Create Resident Account
                <ArrowRight size={17} />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#080d1b] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 md:flex-row">
          <div>
            <div className="text-lg font-extrabold">
              eBarangay
              <span className="text-[#1264ff]">
                Connect
              </span>
            </div>

            <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">
              A digital citizen portal designed to make barangay
              document services more accessible, organized, and
              convenient.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            <p className="font-semibold text-slate-300">
              Barangay San Dok
            </p>

            <p className="mt-1">
              Malolos City, Philippines
            </p>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-5 text-[10px] text-slate-500">
          © 2026 eBarangayConnect. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

