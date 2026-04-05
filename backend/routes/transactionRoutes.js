const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction } = require("../controllers/transactionController");
const { protect, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validate");

router.use(protect);

router.post(
  "/",
  authorize("admin"),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
  body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("date").optional().isISO8601().withMessage("Date must be a valid date"),
  body("notes").optional().isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
  handleValidationErrors,
  createTransaction
);

router.get("/", authorize("admin", "analyst", "viewer"), getTransactions);
router.get("/:id", authorize("admin", "analyst", "viewer"), getTransactionById);

router.put(
  "/:id",
  authorize("admin"),
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
  body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("date").optional().isISO8601().withMessage("Date must be a valid date"),
  body("notes").optional().isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
  handleValidationErrors,
  updateTransaction
);

router.delete("/:id", authorize("admin"), deleteTransaction);

module.exports = router;