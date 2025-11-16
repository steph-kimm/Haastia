import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.js";
import supportRoutes from "./routes/support.js";
import availabilityRoutes from "./routes/availability.js";
import userRoutes from "./routes/user.js";
import professionalRoutes from "./routes/professional.js";
import serviceRoutes from "./routes/service.js";
import bookingRoutes from "./routes/booking.js";
import blockedTimeRoutes from "./routes/blockedTime.js";
import paymentRoutes from "./routes/payment.js";

const app = express();

const stripeWebhookPath = "/api/payment/webhook";
app.use(stripeWebhookPath, express.raw({ type: "application/json" }));

const jsonParser = express.json({ limit: "4mb" });
const urlencodedParser = express.urlencoded({ extended: true });

const shouldBypassBodyParsing = (req) =>
  req.originalUrl?.startsWith(stripeWebhookPath);

app.use((req, res, next) => {
  if (shouldBypassBodyParsing(req)) {
    return next();
  }
  return jsonParser(req, res, next);
});

app.use((req, res, next) => {
  if (shouldBypassBodyParsing(req)) {
    return next();
  }
  return urlencodedParser(req, res, next);
});

app.use(cors());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api", supportRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/user", userRoutes);
app.use("/api/professional", professionalRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/blocked-times", blockedTimeRoutes);
app.use("/api/payment", paymentRoutes);

export default app;
