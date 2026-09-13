import { describe, expect, it } from "vitest";
import { calculateFineAmount, getDueDate, predictFinishDate, validateInventory } from "./libraryLogic";

describe("library business rules", () => {
  it("sets a 14-day due date by default", () => {
    const borrowed = new Date("2026-09-14T00:00:00.000Z");
    expect(getDueDate(borrowed).toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });

  it("calculates late fines in cents and does not fine early returns", () => {
    const due = new Date("2026-09-28T00:00:00.000Z");
    expect(calculateFineAmount(due, new Date("2026-10-01T00:00:00.000Z"))).toEqual({ overdueDays: 3, fineAmount: 300 });
    expect(calculateFineAmount(due, new Date("2026-09-27T00:00:00.000Z"))).toEqual({ overdueDays: 0, fineAmount: 0 });
  });

  it("rejects invalid inventory counts", () => {
    expect(validateInventory(4, 4)).toBe(true);
    expect(() => validateInventory(4, 5)).toThrow("Available copies cannot exceed total copies");
    expect(() => validateInventory(0, 0)).toThrow("Total copies must be at least 1");
  });

  it("predicts a finish date from remaining pages and pace", () => {
    const now = new Date("2026-09-14T00:00:00.000Z");
    expect(predictFinishDate(now, 100, 300, 50).toISOString()).toBe("2026-09-18T00:00:00.000Z");
    expect(predictFinishDate(now, 300, 300, 50).toISOString()).toBe(now.toISOString());
  });
});
