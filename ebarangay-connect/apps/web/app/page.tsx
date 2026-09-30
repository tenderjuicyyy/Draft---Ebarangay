import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between border-b px-8 py-5">
        <div className="text-2xl font-bold text-green-700">
          eBarangay Connect
        </div>

        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-green-700 px-5 py-2 text-green-700 hover:bg-green-50"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 font-semibold text-green-700">
          SMART BARANGAY SERVICES
        </p>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-gray-900">
          Your Barangay Services,
          <span className="block text-green-700">
            Made Easier.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          eBarangay Connect provides a convenient way to request,
          manage, and track barangay documents and services online.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-green-700 px-7 py-3 font-semibold text-white hover:bg-green-800"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-gray-300 px-7 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-gray-50 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Online Requests
            </h2>
            <p className="mt-3 text-gray-600">
              Submit barangay document requests without having to
              repeatedly visit the barangay hall.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Track Requests
            </h2>
            <p className="mt-3 text-gray-600">
              Monitor the status of your submitted documents and
              requests in one place.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Digital Documents
            </h2>
            <p className="mt-3 text-gray-600">
              Access your available barangay documents through a
              centralized digital system.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}