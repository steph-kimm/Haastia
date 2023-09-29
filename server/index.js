// require("dotenv").config();  NTD (1)
// import dotenv from "dotenv";
import {} from 'dotenv/config'
// const JWT_SECRET='dbv83r0f';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";

import morgan from "morgan";
// const morgan = require("morgan");

const app = express();

mongoose
    .connect(process.env.DATABASE) //NTD (1)
    // .connect('mongodb+srv://stephspie31415:6Yen1Vcv2eE2y2iM@cluster0.7xwptmh.mongodb.net/?retryWrites=true&w=majority') // replaced top 
    .then(() => console.log("DB connected"))
    .catch ((err) => console.log("DB CONNECTION ERROR: ", err));

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// route middlewares
app.use("/api", authRoutes);

app.listen(8000, () => console.log("Server running on port 8000"));