
"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileCheck2,
  FileText,
  Home,
  MapPin,
  UserRound,
  Menu,
  Landmark,
  ChevronRight,
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

const quickActions = [
  {
    title: "Request a Document",
    description: "Submit a new barangay document request online.",
    href: "/requests/new",
    icon: FileText,
  },
  {
    title: "My Requests",
    description: "View your submitted requests and their current status.",
    href: "/requests",
    icon: Clock3,
  },
  {
    title: "Resident Account",
    description: "Sign in to access your personalized dashboard.",
    href: "/login",
    icon: UserRound,
  },
];

const steps = [
  {
    number: "01",
    title: "Create an Account",
    description:
      "Register as a resident and access your personal dashboard.",
  },
  {
    number: "02",
    title: "Submit Your Request",
    description:
      "Select the document you need and provide its purpose.",
  },
  {
    number: "03",
    title: "Track the Status",
    description:
      "Monitor whether your request is pending, processing, completed, or rejected.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#172b3d]">
      {/* TOP GOVERNMENT-STYLE BAR */}
      <div className="bg-[#061b2b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c7d7e3] sm:text-xs">
            Digital Citizen Services Portal
          </span>
          <span className="hidden text-xs text-[#c7d7e3] sm:block">
            Mines View, Baguio City, Philippines
          </span>
        </div>
      </div>

      {/* MAIN HEADER */}
      <header className="relative z-10 bg-[#0b304b] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-6 sm:px-8 lg:py-7">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#d5bd81] bg-white/10 text-[#f1d9a1]">
              <Landmark size={27} strokeWidth={1.6} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d5bd81]">
                Digital Barangay Portal
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                eBarangay Connect
              </p>
              <p className="mt-1 text-[10px] tracking-wide text-[#c2d2df]">
                Accessible. Organized. Convenient.
              </p>
            </div>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 lg:flex"
          >
            <a
              href="#services"
              className="text-xs font-bold uppercase tracking-wide transition hover:text-[#e3c58b]"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              className="text-xs font-bold uppercase tracking-wide transition hover:text-[#e3c58b]"
            >
              How It Works
            </a>
            <Link
              href="/login"
              className="text-xs font-bold uppercase tracking-wide transition hover:text-[#e3c58b]"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="border border-[#d5bd81] bg-[#d5bd81] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#0b304b] transition hover:bg-white"
            >
              Create Account
            </Link>
          </nav>

          {/* Mobile navigation */}
          <details className="relative lg:hidden">
            <summary
              aria-label="Open navigation menu"
              className="flex cursor-pointer list-none items-center justify-center border border-white/30 p-3 [&::-webkit-details-marker]:hidden"
            >
              <Menu size={22} />
            </summary>
            <nav
              aria-label="Mobile navigation"
              className="absolute right-0 top-full mt-3 flex w-56 flex-col gap-1 border border-[#d8e0e6] bg-white p-3 text-[#0b304b] shadow-xl"
            >
              <a
                href="#services"
                className="px-3 py-3 text-sm font-semibold hover:bg-[#eef3f6]"
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="px-3 py-3 text-sm font-semibold hover:bg-[#eef3f6]"
              >
                How It Works
              </a>
              <Link
                href="/login"
                className="px-3 py-3 text-sm font-semibold hover:bg-[#eef3f6]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-[#0b304b] px-3 py-3 text-center text-sm font-bold text-white"
              >
                Create Account
              </Link>
            </nav>
          </details>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#102c43] text-white">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage: "url('/barangay-hall.jpg')",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#061725]/95 via-[#09243b]/90 to-[#09243b]/65" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-16 sm:px-8 lg:min-h-132.5 lg:grid-cols-2 lg:gap-16 lg:pb-32 lg:pt-16">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <span className="h-px w-9 bg-[#d5bd81]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#e5c991]">
                Official Digital Service Portal
              </span>
            </div>

            <h1 className="max-w-xl font-sans text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-[58px]">
              Barangay services,
              <br />
              made simpler.
            </h1>

            <p className="mt-7 max-w-lg text-base leading-8 text-[#d9e4ec]">
              eBarangay Connect lets residents submit barangay
              document requests online, monitor their request
              status, and manage their transactions in one
              convenient portal.
            </p>

            <Link
              href="/register"
              className="mt-9 inline-flex min-h-14 items-center justify-center gap-4 border-2 border-white px-8 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white hover:text-[#0b304b]"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Hero photo */}
          <div className="relative">
            <div className="border border-white/30 bg-white/10 p-2 shadow-2xl backdrop-blur-sm">
              <div
                role="img"
                aria-label="Mines View, Baguio City"
                className="h-67.5 bg-[#183e58] bg-cover bg-center sm:h-87.5"
                style={{
                  backgroundImage: "url('/barangay-hall.jpg')",
                }}
              />
            </div>
            <div className="absolute -bottom-5 left-4 right-4 border-l-4 border-[#d5bd81] bg-white px-5 py-4 text-[#173149] shadow-xl sm:left-auto sm:-right-2 sm:min-w-67.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#738497]">
                Community Portal
              </p>
              <p className="mt-1 font-serif text-xl font-bold">
                Mines View
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-[#68798b]">
                <MapPin size={14} />
                Baguio City, Philippines
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS: EXISTING ROUTES PRESERVED */}
      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-5 sm:px-8">
        <div className="grid bg-white shadow-xl md:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className={`group flex items-start gap-4 border border-[#e3e9ee] bg-white p-7 transition hover:bg-[#eef3f7] ${
                  index > 0 ? "md:border-l-0" : ""
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                  <Icon size={23} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-bold text-[#102d45]">
                      {action.title}
                    </h2>
                    <ChevronRight
                      size={17}
                      className="shrink-0 text-[#8193a2] transition group-hover:translate-x-1"
                    />
                  </div>
                  <p className="mt-2 text-xs leading-6 text-[#66798a]">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="scroll-mt-6 bg-white px-5 pb-20 pt-24 sm:px-8 lg:pb-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 border-b border-[#dce3e8] pb-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b40]">
                Citizen Services
              </p>
              <h2 className="mt-4 max-w-2xl font-serif text-3xl text-[#0b304b] sm:text-4xl">
                Available Barangay Documents
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#687b89]">
              Choose the document you need and submit your request
              through your resident account.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article
                  key={service.title}
                  className="flex flex-col border border-[#dce3e8] bg-[#fafcfd] p-7 transition hover:border-[#9baebe] hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center bg-[#e8eef3] text-[#0b304b]">
                      <Icon size={25} />
                    </div>
                    <span className="border border-[#d9e2e8] bg-white px-3 py-2 text-xs font-bold text-[#0b304b]">
                      {service.price}
                    </span>
                  </div>

                  <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9b7b40]">
                    {service.category}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl text-[#102f48]">
                    {service.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-7 text-[#697d8c]">
                    {service.description}
                  </p>

                  <div className="mt-8 flex items-center justify-between border-t border-[#dce3e8] pt-5">
                    <span className="text-xs text-[#788a97]">
                      Processing Time
                    </span>
                    <span className="flex items-center gap-2 text-xs font-bold text-[#173149]">
                      <Clock3 size={15} />
                      {service.processing}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-6 bg-[#edf2f5] px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b40]">
              Simple Process
            </p>
            <h2 className="mt-4 font-serif text-3xl text-[#0b304b] sm:text-4xl">
              How eBarangay Connect Works
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#687b89]">
              Requesting a barangay document only takes a few
              simple steps.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="border-t-4 border-[#0b304b] bg-white p-8 shadow-sm"
              >
                <span className="font-serif text-5xl text-[#b7c8d4]">
                  {step.number}
                </span>
                <h3 className="mt-6 text-lg font-bold text-[#0b304b]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#687b89]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#061b2b] px-5 py-14 text-white sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d5bd81] text-[#d5bd81]">
                  <Landmark size={23} />
                </div>
                <div>
                  <p className="text-lg font-bold">
                    eBarangay Connect
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#d5bd81]">
                    Digital Citizen Portal
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-[#aebfcd]">
                A digital citizen portal designed to make barangay
                document services more accessible, organized, and
                convenient.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#e2c991]">
                Mines View
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm text-[#aebfcd]">
                <MapPin size={16} />
                Baguio City, Philippines
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/15 pt-7 text-xs text-[#aebfcd] sm:flex-row">
            <p>
              2026 eBarangay Connect. All rights reserved.
            </p>
            <p>Digital barangay services for residents.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

