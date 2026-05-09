import { describe, it, expect } from "vitest";

describe("Trial Period Logic", () => {
  it("should calculate trial expiry as 10 days from creation", () => {
    const createdAt = new Date("2026-05-09T00:00:00Z");
    const trialEndDate = new Date(createdAt);
    trialEndDate.setUTCDate(trialEndDate.getUTCDate() + 10);

    expect(trialEndDate.toISOString().split("T")[0]).toBe("2026-05-19");
  });

  it("should determine if trial is expired", () => {
    const now = new Date("2026-05-20T00:00:00Z");
    const createdAt = new Date("2026-05-09T00:00:00Z");
    const trialEndDate = new Date(createdAt);
    trialEndDate.setUTCDate(trialEndDate.getUTCDate() + 10);

    const isExpired = now.getTime() > trialEndDate.getTime();
    expect(isExpired).toBe(true);
  });

  it("should determine if trial is still active", () => {
    const now = new Date("2026-05-15T00:00:00Z");
    const createdAt = new Date("2026-05-09T00:00:00Z");
    const trialEndDate = new Date(createdAt);
    trialEndDate.setUTCDate(trialEndDate.getUTCDate() + 10);

    const isExpired = now.getTime() > trialEndDate.getTime();
    expect(isExpired).toBe(false);
  });

  it("should calculate days remaining correctly", () => {
    const now = new Date("2026-05-12T10:00:00Z");
    const createdAt = new Date("2026-05-09T00:00:00Z");
    const trialEndDate = new Date(createdAt);
    trialEndDate.setUTCDate(trialEndDate.getUTCDate() + 10);

    const daysRemaining = Math.ceil(
      (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysRemaining).toBe(7);
  });

  it("should handle paid plan - expires after 30 days", () => {
    const startDate = new Date("2026-05-09T00:00:00Z");
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 30);

    expect(endDate.toISOString().split("T")[0]).toBe("2026-06-08");
  });

  it("should determine if paid plan is active", () => {
    const now = new Date("2026-05-20T00:00:00Z");
    const startDate = new Date("2026-05-09T00:00:00Z");
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 30);

    const isActive = now.getTime() < endDate.getTime();
    expect(isActive).toBe(true);
  });

  it("should determine if paid plan has expired", () => {
    const now = new Date("2026-06-10T00:00:00Z");
    const startDate = new Date("2026-05-09T00:00:00Z");
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 30);

    const isActive = now.getTime() < endDate.getTime();
    expect(isActive).toBe(false);
  });
});
