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
const dbPath = path.join(__dirname, "database.json");

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/creashift";
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ Connected to MongoDB Atlas");
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));



// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// GLOBAL REQUEST LOGGER
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

app.use(express.static(path.join(__dirname, "../public")));

// --- DATABASE ARCHITECTURE ---
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


// --- API ROUTES ---

// Login
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Models.Admin.findOne({ username, password });
        if (admin) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        if (!hero) return res.json({}); // No fallback hardcoded data
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


// --- PAGE ROUTES ---
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

app.get("/services", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "services.html"));
});

app.get("/blog", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "blog.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "admin.html"));
});

// Support anchor links and sub-pages if needed
app.get("*", (req, res, next) => {
    if (req.url.startsWith("/api")) return next();
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Port binding for Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
