const baseButtonStyle = [
  "display:inline-block",
  "padding:12px 24px",
  "border-radius:8px",
  "text-decoration:none",
  "font-weight:600",
  "color:#ffffff",
  "margin-right:12px",
].join(";");

export const buildCustomerConfirmationEmail = ({
  clientName,
  providerName,
  serviceTitle,
  formattedDate,
  timeRange,
  googleCalendarUrl,
  manageUrl,
  manageRescheduleUrl,
  manageCancelUrl,
  manageToken,
}) => {
  const safeClientName = clientName || "there";
  const safeProviderName = providerName || "your professional";
  const safeServiceTitle = serviceTitle || "Selected service";

  const subject = "Your Haastia Booking Confirmation";

  const calendarText = googleCalendarUrl
    ? `Add to Google Calendar: ${googleCalendarUrl}\n`
    : "";

  const text = `Hi ${safeClientName},\n\n` +
    `Your booking with ${safeProviderName} has been confirmed!\n\n` +
    `📅 Date: ${formattedDate}\n` +
    `⏰ Time: ${timeRange}\n` +
    `💇‍♀️ Service: ${safeServiceTitle}\n\n` +
    calendarText +
    `Manage your booking online at: ${manageUrl}\n` +
    `• Reschedule: ${manageRescheduleUrl}\n` +
    `• Cancel: ${manageCancelUrl}\n\n` +
    `Booking token (for reference): ${manageToken}\n\n` +
    `We look forward to seeing you!\n— The Haastia Team`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <p>Hi ${safeClientName},</p>
      <p>Your booking with ${safeProviderName} has been confirmed!</p>
      <p>
        <strong>📅 Date:</strong> ${formattedDate}<br/>
        <strong>⏰ Time:</strong> ${timeRange}<br/>
        <strong>💇‍♀️ Service:</strong> ${safeServiceTitle}
      </p>
      ${
        googleCalendarUrl
          ? `<p><a href="${googleCalendarUrl}" style="${baseButtonStyle};background-color:#16a34a;">Add to Google Calendar</a></p>`
          : ""
      }
      <p style="margin:24px 0 16px;font-weight:600;">Manage your booking:</p>
      <p>
        <a href="${manageRescheduleUrl}" style="${baseButtonStyle};background-color:#2563eb;">Reschedule</a>
        <a href="${manageCancelUrl}" style="${baseButtonStyle};background-color:#dc2626;">Cancel</a>
      </p>
      <p>You can also manage online at <a href="${manageUrl}">${manageUrl}</a>.</p>
      <p style="margin-top:24px;font-size:14px;color:#4b5563;">
        Booking token (for reference): <code>${manageToken}</code>
      </p>
      <p>We look forward to seeing you!<br/>— The Haastia Team</p>
    </div>
  `;

  return { subject, text, html };
};

export const buildProviderNotificationEmail = ({
  providerName,
  clientName,
  clientEmail,
  formattedDate,
  timeRange,
  serviceTitle,
  googleCalendarUrl,
  manageUrl,
}) => {
  const safeProviderName = providerName || "Professional";
  const safeClientName = clientName || "a client";
  const safeServiceTitle = serviceTitle || "Selected service";
  const subject = "New Booking Received on Haastia";

  const calendarText = googleCalendarUrl
    ? `Add to Google Calendar: ${googleCalendarUrl}\n\n`
    : "";

  const text = `Hi ${safeProviderName},\n\n` +
    `You have a new booking from ${safeClientName}!\n\n` +
    `📅 Date: ${formattedDate}\n` +
    `⏰ Time: ${timeRange}\n` +
    `💇‍♀️ Service: ${safeServiceTitle}\n` +
    `📞 Contact: ${clientEmail || "N/A"}\n\n` +
    calendarText +
    `Clients can manage their own appointments via: ${manageUrl}\n\n` +
    `Log in to your dashboard to review additional details.\n\n` +
    `— The Haastia Team`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <p>Hi ${safeProviderName},</p>
      <p>You have a new booking from <strong>${safeClientName}</strong>.</p>
      <p>
        <strong>📅 Date:</strong> ${formattedDate}<br/>
        <strong>⏰ Time:</strong> ${timeRange}<br/>
        <strong>💇‍♀️ Service:</strong> ${safeServiceTitle}<br/>
        <strong>📞 Contact:</strong> ${clientEmail || "N/A"}
      </p>
      ${
        googleCalendarUrl
          ? `<p><a href="${googleCalendarUrl}" style="${baseButtonStyle};background-color:#16a34a;">Add to Google Calendar</a></p>`
          : ""
      }
      <p>Clients can reschedule or cancel anytime using <a href="${manageUrl}">${manageUrl}</a>.</p>
      <p>Visit your dashboard to review the appointment and collect any outstanding information.</p>
      <p>— The Haastia Team</p>
    </div>
  `;

  return { subject, text, html };
};
