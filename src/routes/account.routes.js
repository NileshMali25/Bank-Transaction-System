const express = require('express');
const authMiddleware = require('../middleware/auth.middleware').authMiddleware;
const router = express.Router();
const accountController=require('../controllers/account.controller');
//post /api/account/
//create a new account for the user

router.post("/", authMiddleware, accountController.createAccount);




module.exports = router;