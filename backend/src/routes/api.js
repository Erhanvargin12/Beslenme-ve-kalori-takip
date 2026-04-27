const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const aiController = require('../controllers/aiController');
const authController = require('../controllers/authController');

// User Routes
router.post('/kayit', (req, res) => userController.register(req, res));
router.get('/kullanicilar', (req, res) => userController.list(req, res));

// Auth Routes
router.post('/kaydol', (req, res) => authController.register(req, res));
router.post('/dogrula', (req, res) => authController.verify(req, res));

// AI Routes
router.post('/analiz-et', (req, res) => aiController.analyze(req, res));
router.post('/tavsiye-al', (req, res) => aiController.getAdvice(req, res));

module.exports = router;
