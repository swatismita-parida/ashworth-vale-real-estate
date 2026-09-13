const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();

// ===== MIDDLEWARE =====
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://ashworth-vale-realestate-56e505.netlify.app'
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.error('❌ MongoDB Error:', err.message));

// ===== MODEL =====
const Enquiry = require('./src/models/Enquiry');

// ===== SMTP TRANSPORTER =====
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.verify()
    .then(() => console.log('✅ SMTP connection successful'))
    .catch((error) => console.error('❌ SMTP connection failed:', error.message));

// ===== TEST ROUTE =====
app.get('/api/test', (req, res) => {
    res.json({ message: '✅ Ashworth & Vale API is working!' });
});

// =====================================================
// ENQUIRY — validation, SMTP email, MongoDB save
// =====================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEnquiry(body) {
    const errors = [];
    const { name, email, phone, interest, message } = body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
        errors.push('Name is required.');
    } else if (name.trim().length < 2 || name.trim().length > 80) {
        errors.push('Name must be between 2 and 80 characters.');
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
        errors.push('Email is required.');
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push('Please provide a valid email address.');
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
        errors.push('Phone number is required.');
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(phone.trim())) {
        errors.push('Please provide a valid phone number.');
    }

    if (!interest || typeof interest !== 'string' || !interest.trim()) {
        errors.push('Please select what you are interested in.');
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
        errors.push('Message is required.');
    } else if (message.trim().length < 10 || message.trim().length > 1000) {
        errors.push('Message must be between 10 and 1000 characters.');
    }

    return errors;
}

app.post('/api/enquiry', async (req, res) => {
    try {
        const errors = validateEnquiry(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const { name, email, phone, interest, message } = req.body;

        const enquiry = new Enquiry({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            interest: interest.trim(),
            message: message.trim()
        });
        await enquiry.save();

        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: process.env.CONTACT_RECEIVER,
                replyTo: enquiry.email,
                subject: `New Property Enquiry — ${enquiry.interest}`,
                text: `Name: ${enquiry.name}\nEmail: ${enquiry.email}\nPhone: ${enquiry.phone}\nInterest: ${enquiry.interest}\n\nMessage:\n${enquiry.message}`
            });
        } catch (mailErr) {
            console.error('⚠️ SMTP send failed:', mailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Your enquiry has been received. An agent will contact you shortly.',
            data: { id: enquiry._id }
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
        }
        console.error('❌ Enquiry error:', err.message);
        res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' });
    }
});

// ===== ADMIN: list enquiries =====
app.get('/api/enquiry', async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};
        if (status && ['new', 'in-progress', 'resolved'].includes(status)) {
            filter.status = status;
        }
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [{ name: regex }, { email: regex }, { message: regex }];
        }
        const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, count: enquiries.length, data: enquiries });
    } catch (err) {
        console.error('❌ Fetch error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch enquiries' });
    }
});

// ===== ADMIN: update status =====
app.patch('/api/enquiry/:id', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['new', 'in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value' });
        }
        const entry = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!entry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
        res.json({ success: true, message: 'Status updated', data: entry });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Invalid enquiry id' });
    }
});

// ===== ADMIN: delete =====
app.delete('/api/enquiry/:id', async (req, res) => {
    try {
        const entry = await Enquiry.findByIdAndDelete(req.params.id);
        if (!entry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
        res.json({ success: true, message: 'Enquiry deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Invalid enquiry id' });
    }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});