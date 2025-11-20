import mongoose from "mongoose";
import request from "supertest";
import { jest } from "@jest/globals";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import User from "../models/user.js";
import Service from "../models/service.js";
import Availability from "../models/availability.js";
import Booking from "../models/booking.js";

jest.setTimeout(20000);

const startOfUtcToday = () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

const nextDateForDayIndex = (dayIndex) => {
  const today = startOfUtcToday();
  const diff = (dayIndex - today.getUTCDay() + 7) % 7 || 7;
  const target = new Date(today);
  target.setUTCDate(target.getUTCDate() + diff);
  return target;
};

const daysFromToday = (days) => {
  const target = startOfUtcToday();
  target.setUTCDate(target.getUTCDate() + days);
  return target;
};

const formatTime = (date) =>
  `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;

const buildSlotFromStart = (startDate, durationMinutes = 60) => {
  const endDate = new Date(startDate);
  endDate.setUTCMinutes(endDate.getUTCMinutes() + durationMinutes);
  return { start: formatTime(startDate), end: formatTime(endDate) };
};

const slotA = { start: "09:00", end: "10:00" };
const slotB = { start: "11:00", end: "12:00" };
const wednesdayDate = nextDateForDayIndex(3);
const thursdayDate = nextDateForDayIndex(4);

let mongoServer;

const createProfessionalWithLimits = async (schedulingLimits = {}) =>
  User.create({
    name: "Limit Pro",
    email: `${Math.random()}@example.com`,
    password: "password",
    role: "professional",
    schedulingLimits,
  });

const createServiceForPro = async (professional) =>
  Service.create({
    professional: professional._id,
    title: "Test Service",
    description: "Test",
    price: 100,
    deposit: 20,
    duration: 60,
  });

describe("scheduling limits", () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      Booking.deleteMany({}),
      Service.deleteMany({}),
      User.deleteMany({}),
      Availability.deleteMany({}),
    ]);
  });

  test("rejects bookings within the minimum lead time", async () => {
    const now = new Date();
    const sameDay = startOfUtcToday();
    const soonStart = new Date(now.getTime() + 30 * 60 * 1000);

    const professional = await createProfessionalWithLimits({
      minBookingLeadTimeMinutes: 120,
    });
    const service = await createServiceForPro(professional);

    const response = await request(app)
      .post("/api/bookings")
      .send({
        professional: professional._id,
        service: service._id,
        date: sameDay.toISOString(),
        timeSlot: buildSlotFromStart(soonStart),
        guestInfo: { name: "Lead", email: "lead@example.com", phone: "123" },
        paymentOption: "deposit",
      })
      .expect(400);

    expect(response.body.error).toMatch(/minutes in advance/i);
  });

  test("rejects bookings too far in the future", async () => {
    const professional = await createProfessionalWithLimits({
      maxBookingDaysInAdvance: 7,
    });
    const service = await createServiceForPro(professional);
    const distantDate = daysFromToday(15);

    const response = await request(app)
      .post("/api/bookings")
      .send({
        professional: professional._id,
        service: service._id,
        date: distantDate.toISOString(),
        timeSlot: slotA,
        guestInfo: { name: "Future", email: "future@example.com", phone: "123" },
        paymentOption: "deposit",
      })
      .expect(400);

    expect(response.body.error).toMatch(/days in advance/i);
  });

  test("stops bookings after per-slot capacity is reached", async () => {
    const professional = await createProfessionalWithLimits({
      maxBookingsPerSlot: 2,
    });
    const service = await createServiceForPro(professional);

    const payload = {
      professional: professional._id,
      service: service._id,
      date: wednesdayDate.toISOString(),
      timeSlot: slotA,
      guestInfo: { name: "Slot", email: "slot@example.com", phone: "123" },
      paymentOption: "deposit",
    };

    await request(app).post("/api/bookings").send(payload).expect(200);
    await request(app).post("/api/bookings").send(payload).expect(200);

    const response = await request(app)
      .post("/api/bookings")
      .send(payload)
      .expect(409);

    expect(response.body.error).toMatch(/capacity/i);
  });

  test("blocks additional bookings once the day cap is hit", async () => {
    const professional = await createProfessionalWithLimits({
      maxBookingsPerDay: 1,
      maxBookingsPerSlot: 5,
    });
    const service = await createServiceForPro(professional);

    await request(app)
      .post("/api/bookings")
      .send({
        professional: professional._id,
        service: service._id,
        date: wednesdayDate.toISOString(),
        timeSlot: slotA,
        guestInfo: { name: "First", email: "first@example.com", phone: "123" },
        paymentOption: "deposit",
      })
      .expect(200);

    const response = await request(app)
      .post("/api/bookings")
      .send({
        professional: professional._id,
        service: service._id,
        date: wednesdayDate.toISOString(),
        timeSlot: slotB,
        guestInfo: { name: "Second", email: "second@example.com", phone: "123" },
        paymentOption: "deposit",
      })
      .expect(409);

    expect(response.body.error).toMatch(/day is fully booked/i);
  });

  test("blocks additional bookings once the weekly cap is hit", async () => {
    const professional = await createProfessionalWithLimits({
      maxBookingsPerWeek: 2,
      maxBookingsPerSlot: 5,
    });
    const service = await createServiceForPro(professional);

    const makeBooking = (date, name) =>
      request(app)
        .post("/api/bookings")
        .send({
          professional: professional._id,
          service: service._id,
          date: date.toISOString(),
          timeSlot: slotA,
          guestInfo: { name, email: `${name}@example.com`, phone: "123" },
          paymentOption: "deposit",
        });

    await makeBooking(wednesdayDate, "WeekOne").expect(200);
    await makeBooking(thursdayDate, "WeekTwo").expect(200);

    const response = await makeBooking(thursdayDate, "WeekThree").expect(409);
    expect(response.body.error).toMatch(/week is fully booked/i);
  });

  test("availability removes slots when caps are reached for the upcoming week", async () => {
    const professional = await createProfessionalWithLimits({
      maxBookingsPerSlot: 1,
      maxBookingsPerDay: 1,
      maxBookingsPerWeek: 2,
    });
    const service = await createServiceForPro(professional);

    await Availability.create({
      professionalId: professional._id,
      day: "Wednesday",
      slots: [slotA, slotB],
    });

    await Availability.create({
      professionalId: professional._id,
      day: "Thursday",
      slots: [slotA],
    });

    const book = (date, slot, name) =>
      request(app)
        .post("/api/bookings")
        .send({
          professional: professional._id,
          service: service._id,
          date: date.toISOString(),
          timeSlot: slot,
          guestInfo: { name, email: `${name}@example.com`, phone: "123" },
          paymentOption: "deposit",
        });

    await book(wednesdayDate, slotA, "CapOne").expect(200);
    await book(thursdayDate, slotA, "CapTwo").expect(200);

    const response = await request(app)
      .get(`/api/bookings/professional/${professional._id}/available-slots`)
      .expect(200);

    const wednesday = response.body.find((entry) => entry.day === "Wednesday");
    const thursday = response.body.find((entry) => entry.day === "Thursday");

    expect(wednesday?.slots).toHaveLength(0);
    expect(thursday?.slots).toHaveLength(0);
  });
});
