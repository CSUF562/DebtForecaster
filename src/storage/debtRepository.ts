import type { DebtObservation } from "../fiscal/debt.js";

export interface DebtObservationRepository {
  save(observation: DebtObservation): Promise<"inserted" | "duplicate">;
  listByRecordDate(recordDate: string): Promise<DebtObservation[]>;
  listRecent(limit: number): Promise<DebtObservation[]>;
}

export class InMemoryDebtObservationRepository
  implements DebtObservationRepository
{
  private readonly rows = new Map<string, DebtObservation>();

  async save(observation: DebtObservation): Promise<"inserted" | "duplicate"> {
    const storageKey = `${observation.recordDate}:${observation.rawPayloadHash}`;

    if (this.rows.has(storageKey)) {
      return "duplicate";
    }

    this.rows.set(storageKey, observation);
    return "inserted";
  }

  async listByRecordDate(recordDate: string): Promise<DebtObservation[]> {
    return [...this.rows.values()]
      .filter(row => row.recordDate === recordDate)
      .sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt));
  }

  async listRecent(limit: number): Promise<DebtObservation[]> {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Recent observation limit must be a positive integer");
    }

    return [...this.rows.values()]
      .sort((a, b) => {
        const byDate = b.recordDate.localeCompare(a.recordDate);
        return byDate !== 0 ? byDate : b.retrievedAt.localeCompare(a.retrievedAt);
      })
      .slice(0, limit);
  }
}
