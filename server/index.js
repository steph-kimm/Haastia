import {} from "dotenv/config";
import mongoose from "mongoose";
import Stripe from "stripe";

import app from "./app.js";

const stripe = new Stripe('sk_test_51SQHC12KTn444Cl1rbhwuYFXRDArq4LQhjexNxJgzNrGUaBNkt8BERfr7QpOl0PiexvdP8E4QVqZ5SmgiQbtQ9wA00tkO405uk');

mongoose
    .connect(process.env.DATABASE)
    .then(() => console.log("DB connected"))
    .catch ((err) => console.log("DB CONNECTION ERROR: ", err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
