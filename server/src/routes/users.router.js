const express = require('express');
const router = express.Router();
const usersController = require("../controller/Auth/users.controller")

// router.post("/register", usersController.registerAccount);
router.post("/login", usersController.loginAccount);
router.post("/logout", usersController.logOutAccount);
router.post("/forgot-password", usersController.forgotPassword);
router.post("/verify-otp", usersController.verifyOTP)
router.put("/reset-password", usersController.resetPassword)

module.exports = router;