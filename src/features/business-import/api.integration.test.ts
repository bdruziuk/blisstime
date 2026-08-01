import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSuperAdminUser: vi.fn(),
  searchCities: vi.fn(),
  createImportJob: vi.fn(),
}));

vi.mock("@/features/business-import/admin-auth", () => ({
  getSuperAdminUser: mocks.getSuperAdminUser,
}));
vi.mock("@/features/business-import/providers/google-places", () => ({
  googlePlacesProvider: { searchCities: mocks.searchCities },
  GooglePlacesError: class GooglePlacesError extends Error {},
}));
vi.mock("@/features/business-import/services/job-service", () => ({
  createImportJob: mocks.createImportJob,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { businessImportJob: { findMany: vi.fn() } },
}));

import { GET as searchCities } from "../../app/api/admin/business-import/cities/search/route";
import { POST as createJob } from "../../app/api/admin/business-import/jobs/route";

describe("business import admin API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSuperAdminUser.mockResolvedValue({ id: "admin", email: "admin@example.com" });
  });

  it("rejects anonymous city search", async () => {
    mocks.getSuperAdminUser.mockResolvedValue(null);
    const response = await searchCities(new Request("http://localhost/api/admin/business-import/cities/search?query=Kyiv"));
    expect(response.status).toBe(403);
  });

  it("searches cities through the server-side provider", async () => {
    mocks.searchCities.mockResolvedValue([{ externalId: "city-1", name: "Київ", formattedName: "Київ, Україна" }]);
    const response = await searchCities(new Request("http://localhost/api/admin/business-import/cities/search?query=Київ&countryCode=ua"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cities: [{ externalId: "city-1", name: "Київ", formattedName: "Київ, Україна" }] });
    expect(mocks.searchCities).toHaveBeenCalledWith("Київ", "ua");
  });

  it("validates and creates a job without processing it in the request", async () => {
    mocks.createImportJob.mockResolvedValue({ id: "job-1", status: "PENDING" });
    const response = await createJob(
      new Request("http://localhost/api/admin/business-import/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityExternalId: "city-1", categories: ["NAIL_SALON"], includeDetails: true }),
      })
    );
    expect(response.status).toBe(201);
    expect(mocks.createImportJob).toHaveBeenCalledWith({
      cityExternalId: "city-1",
      categories: ["NAIL_SALON"],
      includeDetails: true,
      createdById: "admin",
    });
  });
});
