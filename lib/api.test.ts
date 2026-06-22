import { getToken } from "./api";

describe("getToken", () => {
  let originalWindow: any;

  beforeEach(() => {
    // Save original window and localStorage
    originalWindow = global.window;

    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
        window.localStorage.clear();
    }
  });

  afterEach(() => {
    // Restore original window
    if (originalWindow === undefined) {
      delete (global as any).window;
    } else {
      global.window = originalWindow;
    }
  });

  it("should return null if window is undefined", () => {
    // Simulate server-side rendering
    const tempWindow = global.window;
    delete (global as any).window;

    expect(getToken()).toBeNull();

    global.window = tempWindow;
  });

  it("should return null if no tokens are in localStorage", () => {
    expect(getToken()).toBeNull();
  });

  it("should return the value of veklom.access_token if it exists", () => {
    window.localStorage.setItem("veklom.access_token", "test-token-1");
    expect(getToken()).toBe("test-token-1");
  });

  it("should return the value of veklom_token if it exists and the other does not", () => {
    window.localStorage.setItem("veklom_token", "test-token-2");
    expect(getToken()).toBe("test-token-2");
  });

  it("should prioritize veklom.access_token over veklom_token if both exist", () => {
    window.localStorage.setItem("veklom.access_token", "test-token-primary");
    window.localStorage.setItem("veklom_token", "test-token-secondary");
    expect(getToken()).toBe("test-token-primary");
  });
});
