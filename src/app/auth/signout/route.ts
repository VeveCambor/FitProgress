import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const redirectTo = new URL("/login", request.url);
  return NextResponse.redirect(redirectTo, { status: 303 });
}

