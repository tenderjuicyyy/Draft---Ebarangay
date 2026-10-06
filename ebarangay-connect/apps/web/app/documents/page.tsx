import Link from "next/link";
import {
  ArrowLeft,
  FileCheck2,
  FileText,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default async function DocumentsPage() {
  const { data: documents, error } = await supabase
    .from("document_types")
    .select("*")
    .eq("is_active", true)
    .order("id");

  if (error) {
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
          <p className="text-red-600">
            Failed to load documents. Please try again later.
          </p>
        </section>
      </main>
    );
  }

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
          {documents?.map((document) => (
            <article
              key={document.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FileText size={21} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                {document.name}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {document.description}
              </p>

              <div className="mt-6 border-t pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Info size={16} />
                  Document Information
                </div>

                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <FileCheck2
                      size={16}
                      className="mt-0.5 shrink-0 text-green-600"
                    />
                    Processing time: {document.processing_days} day
                    {document.processing_days !== 1 ? "s" : ""}
                  </li>

                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <FileCheck2
                      size={16}
                      className="mt-0.5 shrink-0 text-green-600"
                    />
                    Fee: ₱{Number(document.fee).toFixed(2)}
                  </li>
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