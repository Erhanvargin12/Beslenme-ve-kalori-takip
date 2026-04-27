const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const apiRoutes = require('./routes/api');

// FIX TARGET: Windows Node.js fetch() IPv6 timeout for Google APIs
dns.setDefaultResultOrder('ipv4first');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// Routes
app.use('/', apiRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Sunucu tarafında bir hata oluştu!');
});

module.exports = app;
