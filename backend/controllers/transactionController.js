const Transaction = require("../models/Transaction");

const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      amount, type, category,
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Transaction created successfully.", data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10, sortBy = "date", order = "desc" } = req.query;

    const filter = { isDeleted: false };
    if (type) filter.type = type;
    if (category) filter.category = { $regex: category, $options: "i" };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "asc" ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("createdBy", "name email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, isDeleted: false })
      .populate("createdBy", "name email");

    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );

    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });

    res.status(200).json({ success: true, message: "Transaction updated successfully.", data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });

    res.status(200).json({ success: true, message: "Transaction deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction };