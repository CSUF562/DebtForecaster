import { NextResponse } from "next/server";
import { getDebtSnapshot } from "../../../src/application/debtSnapshot";
import { buildDailyAccountingBrief } from "../../../src/application/dailyBrief";
import { getContextSnapshot } from "../../../src/application/contextSnapshot";
import { getPostgresDailyPublicationRepository } from "../../../src/storage/postgresDailyPublicationRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await getDebtSnapshot();
    const contextSnapshot = await getContextSnapshot(
      snapshot.latest?.recordDate ?? null
    );
    const brief = buildDailyAccountingBrief(
      snapshot.history,
      contextSnapshot.items
    );

    let persistence:
      | "inserted"
      | "duplicate"
      | "skipped"
      | "unavailable" = "unavailable";

    if (process.env.DATABASE_URL && snapshot.latest) {
      try {
        const saved = await getPostgresDailyPublicationRepository().save(
          snapshot.latest.recordDate,
          brief
        );
        persistence = saved.status;
      } catch (error) {
        console.warn("Daily publication persistence unavailable:", error);
      }
    }

    return NextResponse.json(
      {
        generatedAt: snapshot.generatedAt,
        dataSource: snapshot.dataSource,
        latest: snapshot.latest,
        freshness: snapshot.freshness,
        trends: snapshot.trends,
        publication: snapshot.publication,
        contextStatus: contextSnapshot.status,
        contextCoverage: contextSnapshot.coverage,
        brief: {
          publicationId: brief.publicationId,
          release: brief.release,
          persistence,
          publicationStatus: brief.publicationStatus,
          narrative: brief.narrative,
          explanation: brief.explanation,
          unresolved: brief.unresolved,
          context: brief.context,
          materiality: brief.materiality,
          governance: brief.governance
        }
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Enclave snapshot unavailable:", error);

    return NextResponse.json(
      {
        error: "ENCLAVE_SNAPSHOT_UNAVAILABLE",
        message: "The current Enclave snapshot could not be generated."
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
