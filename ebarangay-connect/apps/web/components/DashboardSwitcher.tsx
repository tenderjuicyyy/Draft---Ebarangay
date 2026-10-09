"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Props = {
  current: "admin" | "resident";
};

export default function DashboardSwitcher({ current }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkRole() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile lookup failed:", error.message);
          return;
        }

        if (active) {
          setIsAdmin(profile?.role === "admin");
        }
      } catch (error) {
        console.error("Role verification failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void checkRole();

    return () => {
      active = false;
    };
  }, []);

  if (loading || !isAdmin) return null;

  if (current === "admin") {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-[#0b304b]"
      >
        Resident Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2 border border-white/30 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-[#0b304b]"
    >
      Back to Admin Dashboard
    </Link>
  );
}
