const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const { router: pushRoutes } = require('./routes/push');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/push', pushRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`DanOff server running on http://localhost:${PORT}`);
});
