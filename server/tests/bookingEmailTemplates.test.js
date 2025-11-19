import { buildCustomerConfirmationEmail } from "../utils/bookingEmailTemplates.js";

describe("booking email templates", () => {
  test("customer confirmation email embeds manage URLs", () => {
    const manageUrl = "https://app.haastia.com/bookings/manage/abc";
    const template = buildCustomerConfirmationEmail({
      clientName: "Jordan",
      providerName: "Alex",
      serviceTitle: "Signature Facial",
      formattedDate: "Friday, May 9, 2025",
      timeRange: "10:00 - 11:00",
      manageUrl,
      manageRescheduleUrl: `${manageUrl}?action=reschedule`,
      manageCancelUrl: `${manageUrl}?action=cancel`,
      manageToken: "tok123",
    });

    expect(template.text).toContain(manageUrl);
    expect(template.text).toContain("?action=reschedule");
    expect(template.text).toContain("?action=cancel");
    expect(template.html).toContain("Reschedule");
    expect(template.html).toContain("Cancel");
    expect(template.html).toContain(`href=\"${manageUrl}\"`);
  });
});
