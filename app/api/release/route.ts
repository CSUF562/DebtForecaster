import { NextResponse } from "next/server";
import { getReleaseMetadata } from "../../../src/application/releaseMetadata";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      release: getReleaseMetadata()
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
