// server.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoConnect from "./config/database.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./Inngest/index.js";
import showRouter from "./Routes/showrouter.js";
import bookingRouter from "./Routes/bookingrouter.js";
import adminRouter from "./Routes/adminrouter.js";
import userRouter from "./Routes/userrouter.js";
import { stripeWebhooks } from "./Control/Stripewebhooks.js";
import { clerkWebhooks } from './Control/Clerkwebhooks.js';

const app = express();
const port = process.env.PORT || 8080; // Ensure this matches your .env file

const startServer = async () => {
  try {
    await mongoConnect();

    // ====================================================================
    // IMPORTANT: Stripe webhook MUST be registered BEFORE express.json()
    // This ensures we receive the raw request body for signature verification.
    // ====================================================================
    app.post("/api/clerk", express.raw({ type: 'application/json' }), clerkWebhooks);

    app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

    // General middleware is registered AFTER the Stripe webhook.
    app.use(express.json());
    app.use(cors({
      origin: "http://localhost:5176", // Allow requests from your frontend
      credentials: true,
    }));
    app.use(clerkMiddleware({
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    }));

    // Regular API Routes
    app.get("/", (req, res) => res.send("Server is live!"));
    app.use("/api/inngest", serve({ client: inngest, functions }));
    app.use("/api/show", showRouter);
    app.use("/api/booking", bookingRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/user", userRouter);
    app.get("/api/movies", (req, res) => {
      res.redirect("/api/show/getmovies");
    });

    app.listen(port, () => {
      console.log(`🚀 Server listening at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Fatal error starting server:", err.message);
    process.exit(1);
  }
};

startServer();
export default app;