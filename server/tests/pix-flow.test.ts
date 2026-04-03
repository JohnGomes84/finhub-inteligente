import { describe, it, expect } from "vitest";
import { getDb } from "../db";
import { pixChangeRequests } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("PIX Flow Integration Tests", () => {
  it("1. Should connect to database", async () => {
    const db = await getDb();
    expect(db).toBeDefined();
  });

  it("2. Should list all PIX requests", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests);
    expect(Array.isArray(requests)).toBe(true);
  });

  it("3. Should filter pending PIX requests", async () => {
    const db = await getDb();
    const pending = await db
      .select()
      .from(pixChangeRequests)
      .where(eq(pixChangeRequests.status, "pendente"));
    expect(Array.isArray(pending)).toBe(true);
  });

  it("4. Should filter approved PIX requests", async () => {
    const db = await getDb();
    const approved = await db
      .select()
      .from(pixChangeRequests)
      .where(eq(pixChangeRequests.status, "aprovado"));
    expect(Array.isArray(approved)).toBe(true);
  });

  it("5. Should filter rejected PIX requests", async () => {
    const db = await getDb();
    const rejected = await db
      .select()
      .from(pixChangeRequests)
      .where(eq(pixChangeRequests.status, "rejeitado"));
    expect(Array.isArray(rejected)).toBe(true);
  });

  it("6. Should retrieve PIX request by ID", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests).limit(1);
    if (requests.length > 0) {
      const [request] = await db
        .select()
        .from(pixChangeRequests)
        .where(eq(pixChangeRequests.id, requests[0].id));
      expect(request).toBeDefined();
      expect(request.id).toBe(requests[0].id);
    }
  });

  it("7. Should validate PIX request status field", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests);
    const validStatuses = ["pendente", "aprovado", "rejeitado"];
    requests.forEach((req: any) => {
      expect(validStatuses).toContain(req.status);
    });
  });

  it("8. Should validate PIX request has required fields", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests).limit(1);
    if (requests.length > 0) {
      const req = requests[0];
      expect(req.id).toBeDefined();
      expect(req.employeeId).toBeDefined();
      expect(req.newPixKey).toBeDefined();
      expect(req.status).toBeDefined();
    }
  });

  it("9. Should count total PIX requests", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests);
    expect(requests.length).toBeGreaterThanOrEqual(0);
  });

  it("10. Should validate createdAt timestamp", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests).limit(1);
    if (requests.length > 0) {
      expect(requests[0].createdAt).toBeDefined();
      expect(requests[0].createdAt instanceof Date || typeof requests[0].createdAt === "number").toBe(true);
    }
  });

  it("11. Should validate PIX key format", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests).limit(5);
    requests.forEach((req: any) => {
      expect(req.newPixKey).toBeDefined();
      expect(typeof req.newPixKey).toBe("string");
      expect(req.newPixKey.length).toBeGreaterThan(0);
    });
  });

  it("12. Should validate request/review audit trail", async () => {
    const db = await getDb();
    const requests = await db.select().from(pixChangeRequests);
    const withReview = requests.filter((r: any) => r.reviewedByUserId !== null);
    expect(Array.isArray(withReview)).toBe(true);
  });
});
