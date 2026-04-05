const Transaction = require("../models/Transaction");

const getDashboardSummary = async (req, res) => {
  try {
    const baseFilter = { isDeleted: false };

    const totals = await Transaction.aggregate([
      { $match: baseFilter },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    let totalIncome = 0, totalExpense = 0, incomeCount = 0, expenseCount = 0;
    totals.forEach((item) => {
      if (item._id === "income") { totalIncome = item.total; incomeCount = item.count; }
      else { totalExpense = item.total; expenseCount = item.count; }
    });

    const categoryTotals = await Transaction.aggregate([
      { $match: baseFilter },
      { $group: { _id: { type: "$type", category: "$category" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const recentActivity = await Transaction.find(baseFilter)
      .sort({ date: -1 })
      .limit(5)
      .populate("createdBy", "name");

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        incomeCount,
        expenseCount,
        totalTransactions: incomeCount + expenseCount,
        categoryBreakdown: categoryTotals.map((c) => ({
          type: c._id.type,
          category: c._id.category,
          total: c.total,
          count: c.count,
        })),
        recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMonthlyTrends = async (req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const trends = await Transaction.aggregate([
      { $match: { isDeleted: false, date: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const formatted = {};
    trends.forEach((item) => {
      const key = `${item._id.year}-${monthNames[item._id.month - 1]}`;
      if (!formatted[key]) formatted[key] = { month: key, income: 0, expense: 0 };
      formatted[key][item._id.type] = item.total;
    });

    res.status(200).json({ success: true, data: Object.values(formatted) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWeeklyTrends = async (req, res) => {
  try {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const trends = await Transaction.aggregate([
      { $match: { isDeleted: false, date: { $gte: fourWeeksAgo } } },
      {
        $group: {
          _id: { week: { $isoWeek: "$date" }, year: { $isoWeekYear: "$date" }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const formatted = {};
    trends.forEach((item) => {
      const key = `${item._id.year}-W${item._id.week}`;
      if (!formatted[key]) formatted[key] = { week: key, income: 0, expense: 0 };
      formatted[key][item._id.type] = item.total;
    });

    res.status(200).json({ success: true, data: Object.values(formatted) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryTotals = async (req, res) => {
  try {
    const filter = { isDeleted: false };
    if (req.query.type) filter.type = req.query.type;

    const categories = await Transaction.aggregate([
      { $match: filter },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: categories.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardSummary, getMonthlyTrends, getWeeklyTrends, getCategoryTotals };