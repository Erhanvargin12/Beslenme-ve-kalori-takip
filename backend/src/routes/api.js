const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const router = express.Router();
const userController = require('../controllers/userController');
const aiController = require('../controllers/aiController');
const authController = require('../controllers/authController');
const mealController = require('../controllers/mealController');
const dashboardController = require('../controllers/dashboardController');
const mealPlanController = require('../controllers/mealPlanController');
const systemController = require('../controllers/systemController');
const reportController = require('../controllers/reportController');
const notificationController = require('../controllers/notificationController');

  // User Routes
router.post('/kayit', (req, res) => userController.register(req, res));
router.get('/kullanicilar', (req, res) => userController.list(req, res));
router.get('/kullanicilar/history/:authId', (req, res) => userController.getUserHistory(req, res));
router.get('/kullanicilar/id/:id', (req, res) => userController.getUserById(req, res));
router.post('/kullanicilar/update/:userId', (req, res) => userController.update(req, res));
router.post('/kullanicilar/deactivate/:userId', (req, res) => userController.deactivate(req, res));
router.post('/kullanicilar/reset/:authId', (req, res) => userController.resetData(req, res));
router.post('/user/body-analysis', (req, res) => userController.addBodyAnalysis(req, res));

// Auth Routes
router.post('/kaydol', (req, res) => authController.register(req, res));
router.post('/dogrula', (req, res) => authController.verify(req, res));

// AI Routes
router.post('/analiz-et', asyncHandler((req, res) => aiController.analyze(req, res)));
router.post('/analiz-et-detayli', asyncHandler((req, res) => aiController.analyzeDetailed(req, res)));
router.post('/tavsiye-al', asyncHandler((req, res) => aiController.getAdvice(req, res)));
router.get('/tavsiye-al-haftalik/:userId', asyncHandler((req, res) => aiController.getWeeklyAdvice(req, res)));

// Meal Routes
router.post('/meal', (req, res) => mealController.addMeal(req, res));
router.get('/history/:userId', (req, res) => mealController.getHistory(req, res));
router.get('/summary/:userId', (req, res) => mealController.getSummary(req, res));

// Meal Plan Routes (Öğün Planlayıcı)
router.post('/meal-plan/generate', (req, res) => mealPlanController.generatePlan(req, res));
router.get('/meal-plan/:userId/:weekStart', (req, res) => mealPlanController.getPlan(req, res));
router.post('/meal-plan/add', (req, res) => mealPlanController.addMeal(req, res));
router.delete('/meal-plan/:docId', (req, res) => mealPlanController.deleteMeal(req, res));

// Water Log Routes (Su Takibi)
router.get('/water-log/:userId/:date', (req, res) => mealPlanController.getWaterLog(req, res));
router.post('/water-log', (req, res) => mealPlanController.updateWaterLog(req, res));

// Notification & Message Routes
router.post('/notifications/send', asyncHandler((req, res) => notificationController.sendDirectMessage(req, res)));
router.post('/admin/send-message', asyncHandler((req, res) => notificationController.sendDirectMessage(req, res)));
router.get('/messages/:userId', asyncHandler((req, res) => notificationController.getUserMessages(req, res)));
router.post('/messages/:messageId/read', asyncHandler((req, res) => notificationController.markAsRead(req, res)));

// Dashboard Routes
router.get('/dashboard/stats', (req, res) => dashboardController.getStats(req, res));
router.get('/report/full-history/:userId', (req, res) => reportController.getFullReportData(req, res));

// System Status Routes
router.get('/system/ai-health', (req, res) => systemController.getAiHealth(req, res));
router.get('/system/memory', (req, res) => systemController.getMemoryUsage(req, res));
router.get('/system/status', (req, res) => systemController.getSystemStatus(req, res));

module.exports = router;
