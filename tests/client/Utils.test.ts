import { describe, expect, it } from "vitest";
import { normaliseMapKey } from "../../src/client/Utils";

describe("normaliseMapKey", () => {
  it("should lowercase the input", () => {
    expect(normaliseMapKey("MapName")).toBe("mapname");
    expect(normaliseMapKey("MAP")).toBe("map");
  });

  it("should remove spaces", () => {
    expect(normaliseMapKey("map name")).toBe("mapname");
    expect(normaliseMapKey(" map name ")).toBe("mapname");
  });

  it("should remove dots", () => {
    expect(normaliseMapKey("map.name")).toBe("mapname");
    expect(normaliseMapKey("map..name")).toBe("mapname");
  });

  it("should handle mixed spaces and dots", () => {
    expect(normaliseMapKey("Map Name.v1")).toBe("mapnamev1");
    expect(normaliseMapKey("  Map. Name . ")).toBe("mapname");
  });

  it("should handle empty strings", () => {
    expect(normaliseMapKey("")).toBe("");
  });

  it("should handle strings with only spaces and dots", () => {
    expect(normaliseMapKey(" . . ")).toBe("");
  });
});
