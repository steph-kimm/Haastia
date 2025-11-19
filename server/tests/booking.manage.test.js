import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import User from "../models/user.js";
import Service from "../models/service.js";
import Booking from "../models/booking.js";

let mongoServer;
let professional;
let service;
const baseDate = new Date("2025-05-05T00:00:00.000Z");
baseDate.setUTCHours(0, 0, 0, 0);

const defaultSlot = { start: "09:00", end: "10:00" };

const createPayload = (overrides = {}) => ({
  professional: professional._id.toString(),
  service: service._id.toString(),
  date: baseDate.toISOString(),
  timeSlot: defaultSlot,
  guestInfo: { name: "Token Tester", email: "token@example.com", phone: "555-111-2222" },
  paymentOption: "deposit",
  ...overrides,
});

const createBookingViaApi = async (overrides = {}) =>
  request(app)
    .post("/api/bookings")
    .send(createPayload(overrides))
    .expect(200);

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
  ]);

  professional = await User.create({
    name: "Manager",
    email: "manager@example.com",
    password: "password",
    role: "professional",
  });

  service = await Service.create({
    professional: professional._id,
    title: "Token Service",
    description: "Helps test tokens",
    price: 100,
    deposit: 25,
    duration: 60,
  });
});

describe("customer manage booking endpoints", () => {
  test("returns 404 for invalid manage token", async () => {
    await request(app).get("/api/bookings/manage/not-a-token").expect(404);
  });

  test("fetches booking details by token", async () => {
    const createResponse = await createBookingViaApi();
    expect(createResponse.body.manageToken).toBeTruthy();

    const response = await request(app)
      .get(`/api/bookings/manage/${createResponse.body.manageToken}`)
      .expect(200);

    expect(response.body._id).toEqual(createResponse.body._id);
    expect(response.body.manageToken).toBeUndefined();
    expect(response.body.status).toBe("accepted");
  });

  test("allows cancelling a booking via token", async () => {
    const createResponse = await createBookingViaApi();
    const token = createResponse.body.manageToken;

    const cancelResponse = await request(app)
      .put(`/api/bookings/manage/${token}/cancel`)
      .send({ reason: "Can't make it" })
      .expect(200);

    expect(cancelResponse.body.status).toBe("cancelled");
    expect(cancelResponse.body.cancellation.by).toBe("customer");

    await request(app).put(`/api/bookings/manage/${token}/cancel`).expect(400);
  });

  test("prevents rescheduling into a conflicting slot", async () => {
    const firstBooking = await createBookingViaApi();
    const conflictSlot = { start: "11:00", end: "12:00" };

    await createBookingViaApi({ timeSlot: conflictSlot });

    await request(app)
      .put(`/api/bookings/manage/${firstBooking.body.manageToken}/reschedule`)
      .send({ date: baseDate.toISOString(), timeSlot: conflictSlot })
      .expect(409);
  });

  test("reschedules booking when slot is free", async () => {
    const createResponse = await createBookingViaApi();
    const token = createResponse.body.manageToken;
    const newSlot = { start: "13:00", end: "14:00" };

    const rescheduleResponse = await request(app)
      .put(`/api/bookings/manage/${token}/reschedule`)
      .send({ date: baseDate.toISOString(), timeSlot: newSlot })
      .expect(200);

    expect(rescheduleResponse.body.timeSlot).toEqual(newSlot);
    expect(rescheduleResponse.body.status).toBe("accepted");
  });
});
