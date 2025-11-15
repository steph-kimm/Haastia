import mongoose from "mongoose";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../app.js";
import User from "../models/user.js";

let mongoServer;
let professional;
let customer;
let professionalToken;
let customerToken;

const MAX_GUIDELINES_LENGTH = 2000;

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
  await User.deleteMany({});

  professional = await User.create({
    name: "Pro",
    email: "pro@example.com",
    password: "password",
    role: "professional",
    profileGuidelines: "Existing rules",
  });

  customer = await User.create({
    name: "Customer",
    email: "customer@example.com",
    password: "password",
    role: "customer",
  });

  professionalToken = jwt.sign({ _id: professional._id, role: professional.role }, process.env.JWT_SECRET);
  customerToken = jwt.sign({ _id: customer._id, role: customer.role }, process.env.JWT_SECRET);
});

describe("Professional profile management", () => {
  test("requires authentication", async () => {
    await request(app).get("/api/professional/me/profile").expect(401);
    await request(app)
      .put("/api/professional/me/profile")
      .send({ profileGuidelines: "Rules" })
      .expect(401);
  });

  test("rejects non-professionals", async () => {
    await request(app)
      .get("/api/professional/me/profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .expect(403);

    await request(app)
      .put("/api/professional/me/profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ profileGuidelines: "Rules" })
      .expect(403);
  });

  test("returns the authenticated professional profile", async () => {
    const response = await request(app)
      .get("/api/professional/me/profile")
      .set("Authorization", `Bearer ${professionalToken}`)
      .expect(200);

    expect(response.body.professional._id.toString()).toBe(professional._id.toString());
    expect(response.body.professional.profileGuidelines).toBe("Existing rules");
    expect(Array.isArray(response.body.availability)).toBe(true);
  });

  test("updates profile guidelines with trimming", async () => {
    const response = await request(app)
      .put("/api/professional/me/profile")
      .set("Authorization", `Bearer ${professionalToken}`)
      .send({ profileGuidelines: "  Please arrive on time.  " })
      .expect(200);

    expect(response.body.professional.profileGuidelines).toBe("Please arrive on time.");

    const updated = await User.findById(professional._id);
    expect(updated.profileGuidelines).toBe("Please arrive on time.");
  });

  test("enforces maximum length for profile guidelines", async () => {
    const tooLong = "a".repeat(MAX_GUIDELINES_LENGTH + 1);

    await request(app)
      .put("/api/professional/me/profile")
      .set("Authorization", `Bearer ${professionalToken}`)
      .send({ profileGuidelines: tooLong })
      .expect(400);

    const unchanged = await User.findById(professional._id);
    expect(unchanged.profileGuidelines).toBe("Existing rules");
  });

  test("rejects non-string guidelines", async () => {
    await request(app)
      .put("/api/professional/me/profile")
      .set("Authorization", `Bearer ${professionalToken}`)
      .send({ profileGuidelines: 123 })
      .expect(400);
  });
});
