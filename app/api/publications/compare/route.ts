import { NextRequest, NextResponse } from "next/server";
import { comparePublications } from "../../../../src/application/publicationComparison";
import { getPostgresDailyPublicationRepository } from "../../../../src/storage/postgresDailyPublicationRepository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const leftId = request.nextUrl.searchParams.get("left");
  const rightId = request.nextUrl.searchParams.get("right");

  if (!leftId || !rightId) {
    return NextResponse.json(
      {
        error: "PUBLICATION_IDS_REQUIRED",
        message: "Both left and right publication IDs are required."
      },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        error: "DATABASE_UNAVAILABLE",
        message: "Publication comparison requires the archive database."
      },
      { status: 503 }
    );
  }

  try {
    const repository = getPostgresDailyPublicationRepository();
    const [left, right] = await Promise.all([
      repository.getById(leftId),
      repository.getById(rightId)
    ]);

    if (!left || !right) {
      return NextResponse.json(
        {
          error: "PUBLICATION_NOT_FOUND",
          message: "One or both publication IDs were not found."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        left,
        right,
        comparison: comparePublications(left, right)
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Publication comparison unavailable:", error);

    return NextResponse.json(
      {
        error: "PUBLICATION_COMPARISON_UNAVAILABLE",
        message: "The publication comparison could not be generated."
      },
      { status: 503 }
    );
  }
}
