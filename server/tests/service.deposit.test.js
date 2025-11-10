import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import User from "../models/user.js";
import Service from "../models/service.js";

let mongoServer;
let professional;
let authToken;

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
  await Service.deleteMany({});
  await User.deleteMany({});

  professional = await User.create({
    name: "Deposit Pro",
    email: "deposit@example.com",
    password: "password",
    role: "professional",
  });

  authToken = jwt.sign({ _id: professional._id }, process.env.JWT_SECRET);
});

describe("Service deposit handling", () => {
  test("creates a service with coerced numeric deposit", async () => {
    const response = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Test Service",
        description: "Service description",
        price: "100",
        deposit: "25",
        duration: "60",
      })
      .expect(200);

    expect(response.body.price).toBe(100);
    expect(response.body.deposit).toBe(25);
  });

  test("rejects service creation when deposit exceeds price", async () => {
    const response = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "High Deposit",
        description: "Service description",
        price: 50,
        deposit: 75,
        duration: 30,
      })
      .expect(400);

    expect(response.body.error).toMatch(/deposit cannot be greater than price/i);
  });

  test("rejects non-numeric deposit values", async () => {
    const response = await request(app)
      .post("/api/services")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Bad Deposit",
        description: "Service description",
        price: 40,
        deposit: "abc",
        duration: 30,
      })
      .expect(400);

    expect(response.body.error).toMatch(/deposit must be a number/i);
  });

  test("updates deposit with validation", async () => {
    const service = await Service.create({
      professional: professional._id,
      title: "Existing",
      description: "Service description",
      price: 120,
      deposit: 20,
      duration: 60,
    });

    const validUpdate = await request(app)
      .put(`/api/services/${service._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ deposit: 30 })
      .expect(200);

    expect(validUpdate.body.deposit).toBe(30);

    await request(app)
      .put(`/api/services/${service._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ deposit: 150 })
      .expect(400);

    await request(app)
      .put(`/api/services/${service._id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ price: 25 })
      .expect(400);
  });
});
