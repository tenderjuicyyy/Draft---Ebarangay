
"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileCheck2,
  FileText,
  Home,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const services = [
  {
    category: "CLEARANCE",
    title: "Barangay Clearance",
    price: "₱50",
    description:
      "A document commonly used for employment, applications, transactions, and other official purposes.",
    processing: "1 day",
    icon: FileCheck2,
  },
  {
    category: "CERTIFICATION",
    title: "Certificate of Indigency",
    price: "FREE",
    description:
      "A certification for qualified residents who need proof of financial or economic status.",
    processing: "1 day",
    icon: FileText,
  },
  {
    category: "CERTIFICATION",
    title: "Certificate of Residency",
    price: "₱30",
    description:
      "Certifies that an individual is a resident of the barangay for official or personal transactions.",
    processing: "3 days",
    icon: Home,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#77794f] p-3 text-[#292c21] sm:p-5">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#f4f0e4] shadow-2xl sm:rounded-[36px]">

        {/* NAVIGATION */}
        <header className="border-b border-[#dcd5c4] bg-[#f7f3e9]">
          <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#7b8058] text-[#59603d]">
                <Home size={20} />
              </div>
              <div>
                <p className="text-lg font-black leading-none tracking-tight">
                  eBarangay
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7b8058]">
                  Connect
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <a
                href="#services"
                className="text-sm font-semibold text-[#555548] transition hover:text-[#4c5335]"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-[#555548] transition hover:text-[#4c5335]"
              >
                How It Works
              </a>
              <Link
                href="/login"
                className="text-sm font-semibold text-[#555548] transition hover:text-[#4c5335]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#c96f46] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b8613d]"
              >
                Create Account
              </Link>
            </nav>

            <Link
              href="/login"
              className="rounded-full bg-[#c96f46] px-4 py-2 text-xs font-bold text-white md:hidden"
            >
              Login
            </Link>
          </div>
        </header>

        {/* HERO */}
        <section className="px-5 pt-5 sm:px-8 lg:px-12 lg:pt-8">
          <div className="overflow-hidden rounded-4xl bg-[#ebe5d5]">
            <div className="grid min-h-125 lg:grid-cols-[1.05fr_0.95fr]">

              {/* HERO LEFT */}
              <div className="flex flex-col justify-center px-7 py-12 sm:px-10 lg:px-12">
                <div className="mb-6 flex w-fit items-center gap-2 rounded-full border border-[#cec5ae] bg-[#f6f1e6] px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-[#788052]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#65664e]">
                    Digital Citizen Portal
                  </span>
                </div>

                <h1 className="max-w-xl text-4xl font-black leading-[0.98] tracking-[-0.04em] text-[#25271e] sm:text-5xl lg:text-6xl">
                  Barangay services,
                  <br />
                  made simpler.
                </h1>

                <p className="mt-6 max-w-xl text-sm leading-6 text-[#68675b] sm:text-base">
                  eBarangay Connect lets residents submit barangay
                  document requests online, monitor their request
                  status, and manage their transactions in one
                  convenient portal.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c96f46] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b8613d]"
                  >
                    Get Started
                    <ArrowRight size={17} />
                  </Link>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d0c8b5] text-[#68704a]">
                      <FileText size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-black">
                        Online Requests
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#858273]">
                        Submit digitally
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d0c8b5] text-[#68704a]">
                      <Clock3 size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-black">
                        Status Updates
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#858273]">
                        Track progress
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d0c8b5] text-[#68704a]">
                      <ShieldCheck size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-black">
                        Secure Access
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#858273]">
                        Resident portal
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HERO RIGHT */}
              <div className="relative min-h-95 overflow-hidden lg:min-h-125">
                <div
                  className="absolute inset-5 overflow-hidden rounded-[70px_22px_22px_70px] bg-cover bg-center lg:inset-7"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, rgba(58,63,39,0.05), rgba(58,63,39,0.25)), url('/barangay-hall.jpg')",
                  }}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-[#3f452d]/70 via-transparent to-transparent" />

                  <div className="absolute bottom-6 left-6 right-6 rounded-[20px] border border-white/20 bg-[#f5f0e5]/90 p-5 backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#73775a]">
                      Official Portal
                    </p>
                    <p className="mt-2 text-lg font-black text-[#2d3024]">
                      Mines View
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#747265]">
                      <MapPin size={14} />
                      Baguio City, Philippines
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="px-5 py-7 sm:px-8 lg:px-12">
          <div className="grid gap-3 md:grid-cols-3">

            <Link
              href="/requests/new"
              className="group rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5dfcf] text-[#62694a]">
                  <FileText size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className="text-[#a9a492] transition group-hover:translate-x-1 group-hover:text-[#c96f46]"
                />
              </div>
              <h2 className="mt-5 font-black">
                Request a Document
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#777465]">
                Submit a new barangay document request online.
              </p>
            </Link>

            <Link
              href="/requests"
              className="group rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5dfcf] text-[#62694a]">
                  <Clock3 size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className="text-[#a9a492] transition group-hover:translate-x-1 group-hover:text-[#c96f46]"
                />
              </div>
              <h2 className="mt-5 font-black">
                My Requests
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#777465]">
                View your submitted requests and their current status.
              </p>
            </Link>

            <Link
              href="/login"
              className="group rounded-[22px] border border-[#ddd6c5] bg-[#f8f4ea] p-5 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5dfcf] text-[#62694a]">
                  <UserRound size={20} />
                </div>
                <ArrowRight
                  size={18}
                  className="text-[#a9a492] transition group-hover:translate-x-1 group-hover:text-[#c96f46]"
                />
              </div>
              <h2 className="mt-5 font-black">
                Resident Account
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#777465]">
                Sign in to access your personalized dashboard.
              </p>
            </Link>

          </div>
        </section>

        {/* SERVICES */}
        <section
          id="services"
          className="mx-5 overflow-hidden rounded-[30px] bg-[#4d5435] text-[#f7f2e7] sm:mx-8 lg:mx-12"
        >
          <div className="px-6 py-9 sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">

              <div className="flex flex-col justify-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d2d4bb]">
                  Document Services
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                  Available barangay documents
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-[#d2d4c4]">
                  Choose the document you need and submit your request
                  through your resident account.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {services.map((service) => {
                  const Icon = service.icon;

                  return (
                    <div
                      key={service.title}
                      className="flex flex-col rounded-3xl bg-[#f4efe3] p-5 text-[#292c21]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e4dcc7] text-[#58603e]">
                          <Icon size={20} />
                        </div>
                        <span className="rounded-full bg-[#e8dfca] px-3 py-1 text-xs font-black text-[#626448]">
                          {service.price}
                        </span>
                      </div>

                      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.16em] text-[#888572]">
                        {service.category}
                      </p>

                      <h3 className="mt-1 text-lg font-black">
                        {service.title}
                      </h3>

                      <p className="mt-3 flex-1 text-xs leading-5 text-[#777465]">
                        {service.description}
                      </p>

                      <div className="mt-5 border-t border-[#ddd5c2] pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-semibold text-[#858273]">
                            Processing
                          </span>
                          <span className="text-xs font-black">
                            {service.processing}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
        >
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7b8058]">
              Simple Process
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              How eBarangay Connect works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#777465]">
              Requesting a barangay document only takes a few simple
              steps.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">

            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#505738] text-sm font-black text-white">
                01
              </div>
              <h3 className="mt-5 text-lg font-black">
                Create an Account
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#777465]">
                Register as a resident and access your personal
                dashboard.
              </p>
            </div>

            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#505738] text-sm font-black text-white">
                02
              </div>
              <h3 className="mt-5 text-lg font-black">
                Submit Your Request
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#777465]">
                Select the document you need and provide its purpose.
              </p>
            </div>

            <div className="rounded-3xl border border-[#ddd6c5] bg-[#f8f4ea] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#c96f46] text-sm font-black text-white">
                03
              </div>
              <h3 className="mt-5 text-lg font-black">
                Track the Status
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#777465]">
                Monitor whether your request is pending, processing,
                completed, or rejected.
              </p>
            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-5 pb-7 sm:px-8 lg:px-12">
          <div className="border-t border-[#d8d1bf] pt-7">
            <div className="flex flex-col justify-between gap-7 md:flex-row">

              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7b8058] text-[#59603d]">
                    <Home size={18} />
                  </div>
                  <div>
                    <p className="font-black">
                      eBarangay Connect
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b8058]">
                      Digital Citizen Portal
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-md text-xs leading-5 text-[#777465]">
                  A digital citizen portal designed to make barangay
                  document services more accessible, organized, and
                  convenient.
                </p>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#565947]">
                   Mines View
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs text-[#777465]">
                  <MapPin size={14} />
                  Baguio City, Philippines
                </p>
              </div>

            </div>

            <div className="mt-7 flex flex-col justify-between gap-2 border-t border-[#ddd6c5] pt-5 text-[10px] text-[#8a8778] sm:flex-row">
              <p>
                © 2026 eBarangay Connect. All rights reserved.
              </p>
              <p>
                Digital barangay services for residents.
              </p>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
