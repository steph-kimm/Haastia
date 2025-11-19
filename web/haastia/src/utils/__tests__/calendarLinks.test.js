import { buildGoogleCalendarLink } from "../calendarLinks";

describe("buildGoogleCalendarLink", () => {
  it("returns a Google Calendar template link with encoded parameters", () => {
    const link = buildGoogleCalendarLink({
      startDate: "2024-05-06T12:00:00Z",
      endDate: "2024-05-06T13:00:00Z",
      title: "Strategy Session",
      description: "Review quarterly goals",
      location: "Online",
      timezone: "UTC",
    });

    const url = new URL(link);

    expect(link).toContain("https://calendar.google.com/calendar/render?");
    expect(url.searchParams.get("text")).toBe("Strategy Session");
    expect(url.searchParams.get("dates")).toBe("20240506T120000Z/20240506T130000Z");
    expect(url.searchParams.get("details")).toBe("Review quarterly goals");
    expect(url.searchParams.get("location")).toBe("Online");
    expect(url.searchParams.get("ctz")).toBe("UTC");
  });

  it("returns an empty string when dates are missing", () => {
    expect(buildGoogleCalendarLink({ title: "Missing dates" })).toBe("");
  });
});
