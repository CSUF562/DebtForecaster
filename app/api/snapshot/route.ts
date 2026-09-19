import { NextResponse } from "next/server";
import { getDebtSnapshot } from "../../../src/application/debtSnapshot";
import { buildDailyAccountingBrief } from "../../../src/application/dailyBrief";
import { getContextSnapshot } from "../../../src/application/contextSnapshot";

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
          publicationStatus: brief.publicationStatus,
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
