import Link from "next/link";
import {
  ArrowLeft,
  FileCheck2,
  FileText,
  Info,
} from "lucide-react";

const documents = [
  {
    title: "Barangay Clearance",
    description:
      "A barangay-issued document commonly used for employment, applications, and other transactions.",
    requirements: [
      "Valid government-issued ID",
      "Completed request information",
    ],
  },
  {
    title: "Certificate of Indigency",
    description:
      "A certificate that may be requested when proof of financial condition is required.",
    requirements: [
      "Valid government-issued ID",
      "Completed request information",
    ],
  },
  {
    title: "Barangay Certificate",
    description:
      "A general barangay certification based on verified resident information.",
    requirements: [
      "Valid government-issued ID",
      "Completed request information",
    ],
  },
];

export default function DocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-600"
          >
            <ArrowLeft size={17} />
            Back
          </Link>

          <span className="font-bold text-slate-900">
            eBarangay Connect
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Document Services
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Available barangay documents
          </h1>

          <p className="mt-4 text-slate-600">
            Check the requirements before starting your document request.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <article
              key={document.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FileText size={21} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                {document.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {document.description}
              </p>

              <div className="mt-6 border-t pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Info size={16} />
                  Requirements
                </div>

                <ul className="mt-3 space-y-2">
                  {document.requirements.map((requirement) => (
                    <li
                      key={requirement}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <FileCheck2
                        size={16}
                        className="mt-0.5 shrink-0 text-green-600"
                      />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/login"
                className="mt-6 block rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
              >
                Request Document
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}