const express = require('express');
const authMiddleware = require('../middleware/auth.middleware').authMiddleware;
const router = express.Router();
const accountController=require('../controllers/account.controller');
//post /api/account/
//create a new account for the user

router.post("/", authMiddleware, accountController.createAccount);

/**
 * =GET /api/accounts/
 * Get all account of the logged-in user
 * protected route
 */
router.get("/", authMiddleware, accountController.getUserAccountController);

/**
 * -GET /api/account/balance/:accountId
 */

router.get("/balance/:accountId", authMiddleware, accountController.getAccountBalanceController);

module.exports = router;