import { generateUUID } from "./veklomSim";

describe("generateUUID", () => {
  it("should return a string of length 36", () => {
    const uuid = generateUUID();
    expect(typeof uuid).toBe("string");
    expect(uuid.length).toBe(36);
  });

  it("should match standard UUID format", () => {
    const uuid = generateUUID();
    // UUID v4 format regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it("should generate unique values", () => {
    const uuids = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      uuids.add(generateUUID());
    }

    // Since we generate 1000 UUIDs, they should all be unique,
    // hence the Set size should equal the count.
    expect(uuids.size).toBe(count);
  });

  it("should have a '4' at the 15th character (index 14) indicating UUID version 4", () => {
    const uuid = generateUUID();
    expect(uuid.charAt(14)).toBe('4');
  });

  it("should have an '8', '9', 'a', or 'b' at the 20th character (index 19) indicating correct variant", () => {
    const uuid = generateUUID();
    const variantChar = uuid.charAt(19).toLowerCase();
    expect(['8', '9', 'a', 'b']).toContain(variantChar);
  });
});
