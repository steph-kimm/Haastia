import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import User from "../models/user.js";
import Service from "../models/service.js";
import Booking from "../models/booking.js";
import ClientNote from "../models/clientNote.js";

let mongoServer;
let professional;
let customer;
let authToken;
let customerToken;
let service;

beforeAll(async () => {
  process.env.JWT_SECRET = "testsecret";
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
    ClientNote.deleteMany({}),
    User.deleteMany({}),
  ]);

  professional = await User.create({
    name: "Test Pro",
    email: "pro@example.com",
    password: "password",
    role: "professional",
  });

  customer = await User.create({
    name: "Test Customer",
    email: "customer@example.com",
    password: "password",
    role: "customer",
  });

  service = await Service.create({
    professional: professional._id,
    title: "Cleaning",
    description: "Standard cleaning",
    price: 100,
    deposit: 25,
    duration: 60,
  });

  await Booking.create({
    professional: professional._id,
    customer: customer._id,
    service: service._id,
    date: new Date("2023-01-01T10:00:00.000Z"),
    timeSlot: { start: "10:00", end: "11:00" },
    status: "completed",
  });

  authToken = jwt.sign({ _id: professional._id }, process.env.JWT_SECRET);
  customerToken = jwt.sign({ _id: customer._id }, process.env.JWT_SECRET);
});

describe("Professional customer routes", () => {
  test("requires authentication", async () => {
    await request(app).get("/api/professional/me/customers").expect(401);
  });

  test("rejects non-professionals", async () => {
    await request(app)
      .get("/api/professional/me/customers")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);
  });

  test("lists professional customers", async () => {
    const response = await request(app)
      .get("/api/professional/me/customers")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.customers).toHaveLength(1);
    expect(response.body.customers[0].customerId.toString()).toBe(customer._id.toString());
    expect(response.body.customers[0].totalBookings).toBe(1);
  });

  test("returns customer summary and allows note CRUD", async () => {
    const summary = await request(app)
      .get(`/api/professional/me/customers/${customer._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(summary.body.customer._id.toString()).toBe(customer._id.toString());
    expect(summary.body.notes).toHaveLength(0);
    expect(summary.body.bookings[0].service.deposit).toBe(25);

    const createRes = await request(app)
      .post(`/api/professional/me/customers/${customer._id}/notes`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "Great customer" })
      .expect(201);

    expect(createRes.body.notes).toHaveLength(1);
    const [note] = createRes.body.notes;
    expect(note.content).toBe("Great customer");

    const updateRes = await request(app)
      .put(`/api/professional/me/customers/${customer._id}/notes/${note._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ content: "Updated note" })
      .expect(200);

    expect(updateRes.body.notes[0].content).toBe("Updated note");
  });

  test("prevents customers from creating notes", async () => {
    await request(app)
      .post(`/api/professional/me/customers/${customer._id}/notes`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ content: "Should fail" })
      .expect(403);
  });
});
