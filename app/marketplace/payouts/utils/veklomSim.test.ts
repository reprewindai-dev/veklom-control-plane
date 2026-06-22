import { generateUUID } from "./veklomSim";

describe("generateUUID", () => {
  it("should generate a string of length 36", () => {
    const uuid = generateUUID();
    expect(uuid.length).toBe(36);
  });

  it("should match the UUID v4 format regex", () => {
    const uuid = generateUUID();
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(regex);
  });

  it("should have version number 4", () => {
    const uuid = generateUUID();
    expect(uuid.charAt(14)).toBe("4");
  });

  it("should have a valid variant character (8, 9, a, b)", () => {
    const uuid = generateUUID();
    const variantChar = uuid.charAt(19);
    expect(["8", "9", "a", "b", "A", "B"]).toContain(variantChar);
  });

  it("should generate unique values", () => {
    const iterations = 10000;
    const uuids = new Set<string>();

    for (let i = 0; i < iterations; i++) {
      uuids.add(generateUUID());
    }

    expect(uuids.size).toBe(iterations);
  });
});
