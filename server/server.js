import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import * as Models from "./models.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Robust path for public directory
const PUBLIC_DIR = path.resolve(__dirname, "../public");

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/creashift";
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB Atlas");
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors());
app.use(morgan("minimal")); // Smarter logging for production
app.use(express.json());

// GLOBAL REQUEST LOGGER (Optional for production, but kept for debugging)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- API ROUTES ---

// Health Check for Hostinger Monitoring
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

// Login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (adminUser && adminPass && username === adminUser && password === adminPass) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Generic CRUD helper for Mongoose
const setupCRUD = (resourceName, Model) => {
    app.get(`/api/${resourceName}`, async (req, res) => {
        try {
            const data = await Model.find().sort({ created_at: -1 });
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: "Database Sync Error" });
        }
    });

    app.post(`/api/${resourceName}`, async (req, res) => {
        try {
            const newItem = await Model.create(req.body);
            res.json(newItem);
        } catch (err) {
            res.status(500).json({ error: "Provisioning Failed" });
        }
    });

    app.put(`/api/${resourceName}/:id`, async (req, res) => {
        try {
            const updatedItem = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updatedItem);
        } catch (err) {
            res.status(500).json({ error: "Update Failed" });
        }
    });

    app.delete(`/api/${resourceName}/:id`, async (req, res) => {
        try {
            await Model.findByIdAndDelete(req.params.id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: "Decommissioning Failed" });
        }
    });
};

// Setup resources
setupCRUD("posts", Models.Post);
setupCRUD("services", Models.Service);
setupCRUD("metrics", Models.Metric);
setupCRUD("process", Models.Process);
setupCRUD("messages", Models.Contact);

// Hero is a single object, special handling
app.get("/api/hero", async (req, res) => {
    try {
        const hero = await Models.Hero.findOne();
        if (!hero) return res.json({});
        res.json(hero);
    } catch (err) {
        res.status(500).json({ error: "Identity Fetch Failed" });
    }
});

app.put("/api/hero", async (req, res) => {
    try {
        const hero = await Models.Hero.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.json(hero);
    } catch (err) {
        res.status(500).json({ error: "Identity Sync Failed" });
    }
});

// Contact Form Endpoint
app.post("/api/contact", async (req, res) => {
    try {
        const { name, phone, email, company, message } = req.body;
        const newMessage = await Models.Contact.create({
            name,
            phone: phone || "N/A",
            email,
            company: company || "N/A",
            message
        });

        console.log("💾 Message stored in MongoDB");
        res.status(200).json({ success: true, message: "Message received" });

    } catch (error) {
        console.error("❌ Contact submission failed:", error);
        res.status(500).json({ success: false, message: "Submission failed" });
    }
});

// --- STATIC FILES & PAGE ROUTES ---

// 1. Serve static files from the public folder
// Important: Place this AFTER API routes to prevent static files from overriding API endpoints
app.use(express.static(PUBLIC_DIR));

// 2. Explicitly handle the root route (/) to serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Handle other specific page routes
app.get("/services", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "services.html"));
});

app.get("/blog", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "blog.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

// Catch-all for deep links (SPA-style) or support for sub-pages
app.get("*", (req, res) => {
    // If it's an API request that wasn't caught, return 404
    if (req.url.startsWith("/api")) {
        return res.status(404).json({ error: "API Endpoint Not Found" });
    }
    // For all other requests, serve index.html (or redirect to home)
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Port binding - Hostinger usually requires process.env.PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Production server running on port ${PORT}`);
    console.log(`📁 Static files folder: ${PUBLIC_DIR}`);
});
