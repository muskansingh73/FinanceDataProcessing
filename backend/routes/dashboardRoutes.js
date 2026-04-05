const express = require("express");
const router = express.Router();
const { getDashboardSummary, getMonthlyTrends, getWeeklyTrends, getCategoryTotals } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/summary", authorize("admin", "analyst", "viewer"), getDashboardSummary);
router.get("/monthly-trends", authorize("admin", "analyst"), getMonthlyTrends);
router.get("/weekly-trends", authorize("admin", "analyst"), getWeeklyTrends);
router.get("/categories", authorize("admin", "analyst", "viewer"), getCategoryTotals);

module.exports = router;