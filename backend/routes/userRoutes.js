const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validate");

router.use(protect);
router.use(authorize("admin"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);

router.put(
  "/:id",
  body("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role"),
  body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  handleValidationErrors,
  updateUser
);

router.delete("/:id", deleteUser);

module.exports = router;