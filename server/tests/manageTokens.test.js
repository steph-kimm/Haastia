import { buildManageBookingUrl } from "../utils/manageTokens.js";

describe("manage token helpers", () => {
  const originalBase = process.env.APP_BASE_URL;

  afterEach(() => {
    process.env.APP_BASE_URL = originalBase;
  });

  test("throws when APP_BASE_URL is missing", () => {
    delete process.env.APP_BASE_URL;
    expect(() => buildManageBookingUrl("abc"))
      .toThrow("APP_BASE_URL environment variable is required");
  });

  test("builds a normalized manage URL", () => {
    process.env.APP_BASE_URL = "https://demo.haastia.com/";
    const url = buildManageBookingUrl("abc");
    expect(url).toBe("https://demo.haastia.com/bookings/manage/abc");
  });
});
