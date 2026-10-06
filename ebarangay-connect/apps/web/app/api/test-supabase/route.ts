import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("document_requests")
    .select(`
      id,
      purpose,
      status,
      requested_at,
      profiles (
        full_name,
        email
      ),
      document_types (
        name,
        fee,
        processing_days
      )
    `);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  });
}