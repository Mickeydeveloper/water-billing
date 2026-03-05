const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Load env vars (Hakikisha una faili la .env)
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Inaruhusu JSON data
app.use(cors());         // Inaruhusu kuunganishwa na Frontend (React/Vue)
app.use(morgan('dev'));  // Log za maombi (requests) kwenye terminal

// Route ya majaribio (Test Route)
app.get('/', (req, res) => {
    res.json({ message: "Karibu kwenye Water Billing API (Server ipo salama)" });
});

// Import Routes zako hapa (Mfano: bili, wateja, malipo)
// app.use('/api/customers', require('./routes/customerRoutes'));
// app.use('/api/bills', require('./routes/billRoutes'));

// Error handling kwa ajili ya routes zisizopatikana
app.use((req, res, next) => {
    res.status(404).json({ error: "Route haijapatikana (Not Found)" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server inafanya kazi kwenye port: ${PORT}`);
});
