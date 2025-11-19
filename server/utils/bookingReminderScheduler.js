import Booking from "../models/booking.js";
import { sendEmail } from "./sendEmail.js";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
let reminderIntervalId = null;
let isProcessing = false;

const isTestEnvironment = () => process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID;

const getTomorrowWindow = () => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setUTCDate(tomorrowEnd.getUTCDate() + 1);

  return { tomorrowStart, tomorrowEnd };
};

const formatAppointmentDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const buildReminderMessage = ({ clientName, professionalName, serviceTitle, formattedDate, timeRange }) => {
  return `Hi ${clientName || "there"},\n\nThis is a friendly reminder that you have an appointment tomorrow with ${professionalName || "your professional"}.\n\n📅 Date: ${formattedDate}\n⏰ Time: ${timeRange}\n💇‍♀️ Service: ${serviceTitle || "Selected service"}\n\nIf you need to make any changes, please reach out to your professional as soon as possible.\n\nWe look forward to seeing you!\n— The Haastia Team`;
};

export const processBookingReminders = async () => {
  if (isProcessing || isTestEnvironment() || process.env.DISABLE_BOOKING_REMINDERS === "true") {
    return;
  }

  isProcessing = true;

  try {
    const { tomorrowStart, tomorrowEnd } = getTomorrowWindow();

    const bookings = await Booking.find({
      status: "accepted",
      date: { $gte: tomorrowStart, $lt: tomorrowEnd },
      reminderEmailSentAt: null,
    })
      .populate({ path: "service", select: "title" })
      .populate({ path: "professional", select: "name" })
      .populate({ path: "customer", select: "name email" })
      .lean();

    if (!bookings.length) {
      return;
    }

    for (const booking of bookings) {
      const clientName = booking.customer?.name || booking.guestInfo?.name;
      const clientEmail = booking.customer?.email || booking.guestInfo?.email;

      if (!clientEmail) {
        continue;
      }

      const serviceTitle = booking.service?.title;
      const professionalName = booking.professional?.name;
      const formattedDate = formatAppointmentDate(booking.date);
      const startTime = booking.timeSlot?.start;
      const endTime = booking.timeSlot?.end;
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "Time to be confirmed";

      const subject = "Reminder: Your Haastia appointment is tomorrow";
      const message = buildReminderMessage({
        clientName,
        professionalName,
        serviceTitle,
        formattedDate,
        timeRange,
      });

      try {
        await sendEmail(clientEmail, subject, message);
        await Booking.updateOne({ _id: booking._id }, { reminderEmailSentAt: new Date() });
      } catch (error) {
        console.error("Failed to send reminder email for booking", booking._id, error);
      }
    }
  } catch (error) {
    console.error("Error processing booking reminders:", error);
  } finally {
    isProcessing = false;
  }
};

export const startBookingReminderScheduler = () => {
  if (isTestEnvironment() || reminderIntervalId || process.env.DISABLE_BOOKING_REMINDERS === "true") {
    return;
  }

  const intervalMs = Number(process.env.BOOKING_REMINDER_INTERVAL_MS) || ONE_HOUR_IN_MS;

  processBookingReminders();
  reminderIntervalId = setInterval(() => {
    processBookingReminders();
  }, intervalMs);

  console.log(
    `⏰ Booking reminder scheduler started (every ${Math.round(intervalMs / (60 * 1000))} minutes)`,
  );
};

export const stopBookingReminderScheduler = () => {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
};
