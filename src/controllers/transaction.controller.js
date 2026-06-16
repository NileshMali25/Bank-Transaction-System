const mongoose = require('mongoose');
const accountModel = require('../models/account.model');
const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const userModel = require('../models/user.model');
const emailService = require('../services/email.service');

/**
 * Creates a new transaction
 * THE 10-STEP TRANSFER FLOW:
    * 1.Validate request
    * 2.Validate idempotency key
    * 3.check account status
    * 4.Derive sender balance from ledger
    * 5.Create transaction (PENDING)
    * 6.Create debit ledger entry
    * 7.Create credit ledger entry
    * 8.Mark transaction as COMPLETED
    * 9.Commit mongodb session
    * 10.send email notification
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    // Step 1: Validate request
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount, and idempotencyKey are required",
            status: "failed"
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number",
            status: "failed"
        });
    }

    // Step 2: Validate idempotency key
    try {
        const existingTransaction = await transactionModel.findOne({ idempotencyKey });
        if (existingTransaction) {
            return res.status(409).json({
                message: "Transaction already exists with this idempotency key",
                status: "failed",
                transaction: existingTransaction
            });
        }
    } catch (err) {
        return res.status(500).json({
            message: "Error checking idempotency key",
            error: err.message,
            status: "failed"
        });
    }

    let session;
    try {
        // Step 3: Check account status
        const senderAccount = await accountModel.findById(fromAccount);
        const receiverAccount = await accountModel.findById(toAccount);

        if (!senderAccount || senderAccount.status !== 'ACTIVE') {
            return res.status(400).json({
                message: "Sender account is invalid or not active",
                status: "failed"
            });
        }

        if (!receiverAccount || receiverAccount.status !== 'ACTIVE') {
            return res.status(400).json({
                message: "Receiver account is invalid or not active",
                status: "failed"
            });
        }

        let transaction;
        try{

        session = await mongoose.startSession();
        session.startTransaction();

        // Step 4: Derive sender balance from ledger
        const ledgerEntries = await ledgerModel.find({ account: fromAccount }).session(session);
        let senderBalance = 0;
        for (const entry of ledgerEntries) {
            if (entry.type === 'CREDIT') {
                senderBalance += entry.amount;
            } else if (entry.type === 'DEBIT') {
                senderBalance -= entry.amount;
            }
        }

        if (senderBalance < amount) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Insufficient funds",
                status: "failed"
            });
        }

        // Step 5: Create transaction (PENDING)
        const [createdTransaction] = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session });
        transaction = createdTransaction;

        // Step 6: Create debit ledger entry
        await ledgerModel.create([{
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await (()=>{
            return new Promise ((resolve) => setTimeout(resolve,15 * 1000))
        })()

        // Step 7: Create credit ledger entry
        await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        // Step 8: Mark transaction as COMPLETED
        await transactionModel.findOneAndUpdate(
            {_id:transaction._id},
            {status:"COMPLETED"},
            {session}
        )

        // Step 9: Commit mongodb session
        await session.commitTransaction();
        session.endSession();

    }catch(error){
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        return res.status(400).json({
            message:"Transaction is pending due to some issue,please retry after some time",
            status: "failed"
        });
    }
        // Step 10: Send email notification
        const senderUser = await userModel.findById(senderAccount.user);
        if (senderUser && senderUser.email) {
            emailService.sendTransactionEmail(senderUser.email, senderUser.name, amount, toAccount)
                .catch(err => console.error("Error sending transaction email:", err));
        }

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction
        });

    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        return res.status(500).json({
            message: "Transaction failed",
            error: err.message,
            status: "failed"
        });
    }
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required",
            status: "failed"
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number",
            status: "failed"
        });
    }

    let session;
    try {
        const toUserAccount = await accountModel.findOne({
            _id: toAccount,
        });

        if (!toUserAccount) {
            return res.status(400).json({
                message: "Invalid toAccount",
                status: "failed"
            });
        }

        let FromUserAccount = await accountModel.findOne({
            user: req.user._id
        });

        if (!FromUserAccount) {
            FromUserAccount = await accountModel.create({
                user: req.user._id,
                status: "ACTIVE",
                currency: "INR"
            });
        }

        session = await mongoose.startSession();
        session.startTransaction();

        const transaction = new transactionModel({
            fromAccount: FromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        });

        const debitLedgerEntry = await ledgerModel.create([{
            account: FromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: transaction
        });

    } catch (err) {
        if (session) {
            await session.abortTransaction();
            session.endSession();
        }
        return res.status(500).json({
            message: "Transaction failed",
            error: err.message,
            status: "failed"
        });
    }
}

module.exports = { createTransaction, createInitialFundsTransaction };
