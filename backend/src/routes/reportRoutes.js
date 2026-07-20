const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Kullanıcının tam geçmiş verisini getirir
router.get('/full-history/:userId', reportController.getFullReportData);

module.exports = router;
