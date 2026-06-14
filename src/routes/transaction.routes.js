const {Router} = require('express');
const { authMiddleware, authSystemUserMiddleware } = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

const transactionRoutes=Router();

//post - /api/transaction
//create a new transaction
transactionRoutes.post('/',authMiddleware,transactionController.createTransaction); 

/**
 * -post -/api/transaction/system/initial-funds
 * create initial funds transaction for system user
 */
transactionRoutes.post('/system/initial-funds',authSystemUserMiddleware,transactionController.createInitialFundsTransaction);

module.exports=transactionRoutes;
