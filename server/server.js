import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "database.json");

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

// --- NODEMAILER CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Verify SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ SMTP Connection Error:", error);
    } else {
        console.log("✅ SMTP Server is ready to take our messages");
    }
});

// Helper to read/write DB
const readDB = () => JSON.parse(fs.readFileSync(dbPath, "utf8"));
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// --- API ROUTES ---

// Login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    if (db.admin.username === username && db.admin.password === password) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// Generic CRUD helper
const setupCRUD = (resource) => {
    app.get(`/api/${resource}`, (req, res) => {
        const db = readDB();
        res.json(db[resource]);
    });

    app.post(`/api/${resource}`, (req, res) => {
        const db = readDB();
        const newItem = { id: Date.now().toString(), ...req.body, created_at: new Error().toISOString() };
        if (Array.isArray(db[resource])) {
            db[resource].push(newItem);
        } else {
            db[resource] = newItem; // For single objects like 'hero'
        }
        writeDB(db);
        res.json(newItem);
    });

    app.put(`/api/${resource}/:id`, (req, res) => {
        const db = readDB();
        const index = db[resource].findIndex(item => item.id === req.params.id);
        if (index !== -1) {
            db[resource][index] = { ...db[resource][index], ...req.body };
            writeDB(db);
            res.json(db[resource][index]);
        } else {
            res.status(404).json({ error: "Not found" });
        }
    });

    app.delete(`/api/${resource}/:id`, (req, res) => {
        const db = readDB();
        db[resource] = db[resource].filter(item => item.id !== req.params.id);
        writeDB(db);
        res.json({ success: true });
    });
};

// Setup resources
setupCRUD("posts");
setupCRUD("services");
setupCRUD("metrics");
setupCRUD("process");
setupCRUD("messages");

// Hero is a single object, special handling
app.get("/api/hero", (req, res) => {
    const db = readDB();
    res.json(db.hero);
});

app.put("/api/hero", (req, res) => {
    const db = readDB();
    db.hero = { ...db.hero, ...req.body };
    writeDB(db);
    res.json(db.hero);
});

// Contact Form Endpoint (Database based)
app.post("/api/contact", async (req, res) => {
    try {
        const { name, phone, email, company, message } = req.body;
        const db = readDB();

        const newMessage = {
            id: Date.now().toString(),
            name,
            phone: phone || "N/A",
            email,
            company: company || "N/A",
            message,
            created_at: new Date().toISOString()
        };

        // 1. Store in Database
        db.messages.push(newMessage);
        writeDB(db);
        console.log("💾 Message stored in database");

        // 2. Send Email Notification
        const mailOptions = {
            from: `"Creashift Contact" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to yourself
            subject: `New Lead: ${name} from ${company || "N/A"}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: #4f46e5;">New Contact Inquiry</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Phone:</strong> ${phone || "N/A"}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Company:</strong> ${company || "N/A"}</p>
                    <hr style="border: 0; border-top: 1px solid #eee;">
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("❌ Email failed to send:", error);
                // We still send success to user because DB storage succeeded
            } else {
                console.log("📧 Email sent: " + info.response);
            }
        });

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
