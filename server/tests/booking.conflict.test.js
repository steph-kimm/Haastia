import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import User from "../models/user.js";
import Service from "../models/service.js";
import Availability from "../models/availability.js";
import Booking from "../models/booking.js";

let mongoServer;
let professional;
let service;
const slot = { start: "09:00", end: "10:00" };
const bookingDate = new Date("2025-01-01T00:00:00.000Z");
bookingDate.setUTCHours(0, 0, 0, 0);

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

  professional = await User.create({
    name: "Conflict Pro",
    email: "conflict@example.com",
    password: "password",
    role: "professional",
  });

  service = await Service.create({
    professional: professional._id,
    title: "Hair Styling",
    description: "Test Service",
    price: 100,
    deposit: 25,
    duration: 60,
  });
});

describe("booking slot conflicts", () => {
  test("prevents booking the same slot twice", async () => {
    const payload = {
      professional: professional._id,
      service: service._id,
      date: bookingDate.toISOString(),
      timeSlot: slot,
      guestInfo: { name: "Tester", email: "test@example.com", phone: "1234567890" },
      paymentOption: "deposit",
    };

    const firstResponse = await request(app).post("/api/bookings").send(payload).expect(200);

    expect(firstResponse.body?._id).toBeTruthy();

    const conflictResponse = await request(app)
      .post("/api/bookings")
      .send(payload)
      .expect(409);

    expect(conflictResponse.body.error).toMatch(/time slot/i);
  });

  test("removes slots held by pending bookings from availability", async () => {
    await Availability.create({
      professionalId: professional._id,
      day: "Wednesday",
      slots: [slot],
    });

    await Booking.create({
      professional: professional._id,
      service: service._id,
      date: bookingDate,
      timeSlot: slot,
      status: "pending",
      paymentOption: "deposit",
      amountDue: 25,
      amountPaid: 0,
      paymentStatus: "requires_payment",
    });

    const response = await request(app)
      .get(`/api/bookings/professional/${professional._id}/available-slots`)
      .expect(200);

    const wednesday = response.body.find((entry) => entry.day === "Wednesday");
    expect(wednesday).toBeDefined();
    expect(wednesday.slots).toHaveLength(0);
  });

  test("allows free bookings when service permits them", async () => {
    await Service.findByIdAndUpdate(service._id, { allowFreeReservations: true });

    const payload = {
      professional: professional._id,
      service: service._id,
      date: bookingDate.toISOString(),
      timeSlot: slot,
      guestInfo: { name: "Free Tester", email: "free@example.com", phone: "1234567890" },
      paymentOption: "free",
    };

    const response = await request(app).post("/api/bookings").send(payload).expect(200);

    expect(response.body.amountDue).toBe(0);
    expect(response.body.paymentStatus).toBe("paid");
    expect(response.body.amountPaid).toBe(0);
    expect(response.body.paidAt).toBeTruthy();
  });

  test("rejects free bookings when service disallows them", async () => {
    const payload = {
      professional: professional._id,
      service: service._id,
      date: bookingDate.toISOString(),
      timeSlot: slot,
      guestInfo: { name: "Free Tester", email: "free@example.com", phone: "1234567890" },
      paymentOption: "free",
    };

    const response = await request(app).post("/api/bookings").send(payload).expect(400);

    expect(response.body.error).toMatch(/free reservations/i);
  });
});
