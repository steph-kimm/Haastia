const formatCalendarDateTime = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const isoString = date.toISOString();
  const [datePart, timePart] = isoString.split("T");
  if (!datePart || !timePart) return null;
  const dateSegment = datePart.replace(/-/g, "");
  const timeSegment = timePart.replace(/:/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${dateSegment}T${timeSegment}`;
};

export const buildGoogleCalendarLink = ({
  startDate,
  endDate,
  title,
  description,
  location,
  timezone,
} = {}) => {
  const start = formatCalendarDateTime(startDate);
  const end = formatCalendarDateTime(endDate);

  if (!start || !end) return "";

  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", title || "Booking");
  params.set("dates", `${start}/${end}`);

  if (description) {
    params.set("details", description);
  }

  if (location) {
    params.set("location", location);
  }

  if (timezone) {
    params.set("ctz", timezone);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export default buildGoogleCalendarLink;
