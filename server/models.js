import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
    icon: String,
    title: { type: String, required: true },
    desc: String,
    detailed_desc: String,
    features: String,
    benefits: String,
    image_url: String,
    created_at: { type: Date, default: Date.now }
});

const ContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    message: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: String,
    excerpt: String,
    content: String,
    image_url: String,
    created_at: { type: Date, default: Date.now }
});

const HeroSchema = new mongoose.Schema({
    title_line1: String,
    title_line2: String,
    subtitle: String,
    highlights: [{
        title: String,
        desc: String
    }]
});

const MetricSchema = new mongoose.Schema({
    label: String,
    target: Number,
    suffix: String,
    created_at: { type: Date, default: Date.now }
});

const ProcessSchema = new mongoose.Schema({
    step: Number,
    title: String,
    desc: String,
    created_at: { type: Date, default: Date.now }
});

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

export const Service = mongoose.model('Service', ServiceSchema);
export const Contact = mongoose.model('Contact', ContactSchema);
export const Post = mongoose.model('Post', PostSchema);
export const Hero = mongoose.model('Hero', HeroSchema);
export const Metric = mongoose.model('Metric', MetricSchema);
export const Process = mongoose.model('Process', ProcessSchema);
export const Admin = mongoose.model('Admin', AdminSchema);
