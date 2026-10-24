import { describe, expect, it } from "vitest";
import { parseReferenceFromText } from "./reference-parser";

describe("parseReferenceFromText", () => {
  it("parses explicit references", () => {
    const result = parseReferenceFromText("Please turn to John 3:16");
    expect(result).not.toBeNull();
    expect(result?.book).toBe("John");
    expect(result?.chapter).toBe(3);
    expect(result?.verse).toBe(16);
    expect(result?.reference).toBe("John 3:16");
  });

  it("parses Romans references", () => {
    const result = parseReferenceFromText("Romans 5:8");
    expect(result?.book).toBe("Romans");
    expect(result?.chapter).toBe(5);
    expect(result?.verse).toBe(8);
  });

  it("returns null for non-references", () => {
    expect(parseReferenceFromText("hello world")).toBeNull();
  });

  it("parses spoken number references", () => {
    expect(parseReferenceFromText("John three sixteen")?.reference).toBe("John 3:16");
    expect(parseReferenceFromText("turn to Romans five eight")?.reference).toBe("Romans 5:8");
    expect(parseReferenceFromText("John 3 16")?.reference).toBe("John 3:16");
  });

  it("parses verse ranges (first verse)", () => {
    expect(parseReferenceFromText("John 3:16-18")?.reference).toBe("John 3:16");
    expect(parseReferenceFromText("John 3 16 through 18")?.reference).toBe("John 3:16");
  });
});
