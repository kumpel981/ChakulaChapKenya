const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'ChakulaChap Kenya API', status: 'running' });
});

// WhatsApp webhook
app.post('/api/whatsapp/webhook', (req, res) => {
    console.log('WhatsApp webhook:', req.body);
    
    // Process WhatsApp message
    const message = req.body.message;
    const phone = req.body.phone;
    
    // Simple response
    const response = {
        to: phone,
        message: `Thanks for contacting ChakulaChap! We received: ${message}`
    };
    
    res.json(response);
});

// M-Pesa callback
app.post('/api/mpesa/callback', (req, res) => {
    console.log('M-Pesa callback:', req.body);
    res.json({ status: 'received' });
});

// Admin API
app.get('/api/admin/stats', (req, res) => {
    res.json({
        campuses: 8,
        meals: 156,
        users: 2450,
        revenue: 24580
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});