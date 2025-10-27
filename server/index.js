// require("dotenv").config();  NTD (1)
// import dotenv from "dotenv";
import {} from 'dotenv/config'
// const JWT_SECRET='dbv83r0f';
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import postRoutes from './routes/post.js'
import requestRoutes from './routes/request.js'
import supportRoutes from './routes/support.js'
import availabilityRoutes from "./routes/availability.js";

import morgan from "morgan";


const app = express();

// const htpp = require('http').createServer(app); WAS causing erros replaced with below

// TODO: Below makes comp a server, uncomment if needed and make to above.
// import * as http from 'http';
// const htpp = http.createServer(app);

mongoose
    .connect(process.env.DATABASE) //NTD (1)
    // .connect('mongodb+srv://stephspie31415:6Yen1Vcv2eE2y2iM@cluster0.7xwptmh.mongodb.net/?retryWrites=true&w=majority') // replaced top 
    .then(() => console.log("DB connected"))
    .catch ((err) => console.log("DB CONNECTION ERROR: ", err));

// middlewares
app.use(express.json({limit: '4mb'}));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// route middlewares
app.use("/api", authRoutes);
app.use("/api", postRoutes);
app.use("/api", requestRoutes);
app.use("/api", supportRoutes);
app.use("/api/availability", availabilityRoutes);

app.listen(8000, () => console.log("Server running on port 8000"));