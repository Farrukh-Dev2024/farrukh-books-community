//export { auth as middleware } from "@/lib/auth"
// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  // Do nothing, just pass through
  return NextResponse.next();
}

export const config = {
  // Optional: match all routes, or remove if you want it global
  matcher: "/:path*",
};
