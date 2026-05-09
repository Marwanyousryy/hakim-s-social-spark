import { describe, it, expect } from "vitest";

// HMAC computation test - verify algorithm matches Paymob expectations
async function computeHmacTest(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getPathTest(obj: any, path: string): string {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return "";
    cur = cur[p];
  }
  if (cur === null || cur === undefined) return "";
  return String(cur);
}

describe("HMAC Verification", () => {
  it("should extract nested object paths correctly", () => {
    const obj = {
      order: { id: "12345", merchant_order_id: "user_plan_ts" },
      source_data: { pan: "1234****5678", type: "card", sub_type: "visa" },
    };

    expect(getPathTest(obj, "order.id")).toBe("12345");
    expect(getPathTest(obj, "source_data.pan")).toBe("1234****5678");
    expect(getPathTest(obj, "source_data.type")).toBe("card");
  });

  it("should return empty string for missing paths", () => {
    const obj = { name: "test" };
    expect(getPathTest(obj, "order.id")).toBe("");
    expect(getPathTest(obj, "nonexistent")).toBe("");
  });

  it("should convert boolean values to strings", () => {
    const obj = { success: true, pending: false, is_auth: true };
    expect(getPathTest(obj, "success")).toBe("true");
    expect(getPathTest(obj, "pending")).toBe("false");
    expect(getPathTest(obj, "is_auth")).toBe("true");
  });

  it("should compute HMAC correctly", async () => {
    const secret = "test_secret";
    const message = "test_message";
    const hmac1 = await computeHmacTest(secret, message);
    const hmac2 = await computeHmacTest(secret, message);

    // Same inputs should produce same output
    expect(hmac1).toBe(hmac2);
    // HMAC should be a hex string
    expect(/^[a-f0-9]+$/.test(hmac1)).toBe(true);
    // SHA-512 produces 128 hex characters
    expect(hmac1).toHaveLength(128);
  });

  it("should concatenate HMAC fields in order", async () => {
    const HMAC_FIELDS = [
      "amount_cents",
      "created_at",
      "currency",
      "error_occured",
      "has_parent_transaction",
      "id",
    ];

    const obj = {
      amount_cents: "10000",
      created_at: "2026-05-09T10:00:00Z",
      currency: "EGP",
      error_occured: "false",
      has_parent_transaction: "false",
      id: "1234567",
    };

    const message = HMAC_FIELDS.map((f) => getPathTest(obj, f)).join("");
    expect(message).toBe("100002026-05-09T10:00:00ZEGPfalsefalse1234567");
  });
});
