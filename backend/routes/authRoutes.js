const express = require("express");
const router = express.Router();

const {
  registerUser,
  login
} = require("../controllers/authController");

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", login);

module.exports = router;
