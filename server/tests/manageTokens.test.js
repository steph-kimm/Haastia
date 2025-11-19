import { buildManageBookingUrl } from "../utils/manageTokens.js";

describe("manage token helpers", () => {
  const originalBase = process.env.APP_BASE_URL;

  afterEach(() => {
    process.env.APP_BASE_URL = originalBase;
  });

  test("builds the default localhost URL when APP_BASE_URL is missing", () => {
    delete process.env.APP_BASE_URL;
    expect(buildManageBookingUrl("abc")).toBe("http://localhost:3000/bookings/manage/abc");
  });

  test("builds a normalized manage URL", () => {
    process.env.APP_BASE_URL = "https://demo.haastia.com/";
    const url = buildManageBookingUrl("abc");
    expect(url).toBe("https://demo.haastia.com/bookings/manage/abc");
  });
});
