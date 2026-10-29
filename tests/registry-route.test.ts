// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), item: vi.fn() }));
vi.mock("../lib/components", () => ({ findComponent: mocks.find }));
vi.mock("../lib/component-registry", () => ({ componentRegistryItem: mocks.item }));
import { GET } from "../app/r/[name]/route";

beforeEach(() => { vi.clearAllMocks(); mocks.find.mockImplementation((name: string) => name === "button" ? { slug: "button" } : undefined); mocks.item.mockResolvedValue({ name: "orangeui-button", type: "registry:item", files: [] }); });
const request = (name: string, search = "") => GET(new Request(`https://example.test/r/${encodeURIComponent(name)}${search}`), { params: Promise.resolve({ name }) });

it("awaits route params and serves a .json catalogue item in the requested appearance", async () => {
  const response = await request("button.json", "?style=terminal");
  expect(response.status).toBe(200); expect(response.headers.get("Content-Type")).toContain("application/json"); expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(mocks.find).toHaveBeenCalledWith("button"); expect(mocks.item).toHaveBeenCalledWith({ slug: "button" }, "terminal"); expect(await response.json()).toMatchObject({ type: "registry:item" });
});
it("defaults to polished and rejects unknown appearances before source assembly", async () => {
  await request("button"); expect(mocks.item).toHaveBeenCalledWith({ slug: "button" }, "polished"); mocks.item.mockClear();
  expect((await request("button", "?style=unknown")).status).toBe(400); expect(mocks.item).not.toHaveBeenCalled();
});
it("never turns path-like names or unknown components into source file reads", async () => {
  for (const name of ["../LICENSE", "..%2f.env", "button.tsx", "private", "button/../../private"]) expect((await request(name)).status).toBe(404);
  expect(mocks.item).not.toHaveBeenCalled();
});
it("does not expose file paths or missing-file errors in an assembly failure", async () => {
  mocks.item.mockRejectedValue(new Error("ENOENT C:/private/secret.env"));
  const response = await request("button"); expect(response.status).toBe(500); expect(response.headers.get("Cache-Control")).toBe("no-store"); expect(await response.text()).toBe('{"error":"Registry item unavailable"}');
});
