require('dotenv').config();
const mongoose = require('mongoose');
const accountModel = require('./src/models/account.model');
const transactionModel = require('./src/models/transaction.model');
const ledgerModel = require('./src/models/ledger.model');

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const fromAccountId = "6a2f0236944b2ce3afd07e5f";
    const toAccountId = "6a2dbb0a1253e96117ac4c9c";
    const amount = 1000;
    const idempotencyKey = "019eccb3-9703-7b70-a7b3-6133f94d4fc9";

    // 1. Verify/fetch accounts
    const sender = await accountModel.findById(fromAccountId);
    const receiver = await accountModel.findById(toAccountId);

    if (!sender) {
        console.error(`Sender account ${fromAccountId} not found.`);
        mongoose.disconnect();
        return;
    }
    if (!receiver) {
        console.error(`Receiver account ${toAccountId} not found.`);
        mongoose.disconnect();
        return;
    }

    console.log("Sender account status:", sender.status);
    console.log("Receiver account status:", receiver.status);

    // 2. Check sender balance
    const senderEntries = await ledgerModel.find({ account: fromAccountId });
    let senderBalance = 0;
    for (const entry of senderEntries) {
        if (entry.type === 'CREDIT') senderBalance += entry.amount;
        if (entry.type === 'DEBIT') senderBalance -= entry.amount;
    }
    console.log(`Sender initial balance: ${senderBalance} INR`);

    // 3. Fund sender if balance is insufficient
    if (senderBalance < amount) {
        console.log(`Funding sender account with 5000 INR to ensure transaction success...`);
        const fundingTx = await transactionModel.create({
            fromAccount: fromAccountId, 
            toAccount: fromAccountId,
            amount: 5000,
            idempotencyKey: "funding-" + Date.now(),
            status: "COMPLETED"
        });

        await ledgerModel.create({
            account: fromAccountId,
            amount: 5000,
            transaction: fundingTx._id,
            type: "CREDIT"
        });
        console.log("Sender account funded successfully.");
    }

    // 4. Check if idempotency key is already used
    const existingTx = await transactionModel.findOne({ idempotencyKey });
    if (existingTx) {
        console.log("Transaction with this idempotency key already exists:", existingTx);
        mongoose.disconnect();
        return;
    }

    // 5. Execute the transaction using mongoose transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log("Executing transaction...");
        const transaction = new transactionModel({
            fromAccount: fromAccountId,
            toAccount: toAccountId,
            amount,
            idempotencyKey,
            status: "PENDING"
        });

        await ledgerModel.create([{
            account: fromAccountId,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session });

        await ledgerModel.create([{
            account: toAccountId,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();
        console.log("Transaction committed successfully:", transaction);

        // 6. Check final balances
        const finalSenderEntries = await ledgerModel.find({ account: fromAccountId });
        let finalSenderBalance = 0;
        for (const entry of finalSenderEntries) {
            if (entry.type === 'CREDIT') finalSenderBalance += entry.amount;
            if (entry.type === 'DEBIT') finalSenderBalance -= entry.amount;
        }

        const finalReceiverEntries = await ledgerModel.find({ account: toAccountId });
        let finalReceiverBalance = 0;
        for (const entry of finalReceiverEntries) {
            if (entry.type === 'CREDIT') finalReceiverBalance += entry.amount;
            if (entry.type === 'DEBIT') finalReceiverBalance -= entry.amount;
        }

        console.log(`Sender final balance: ${finalSenderBalance} INR`);
        console.log(`Receiver final balance: ${finalReceiverBalance} INR`);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed and rolled back:", error);
    }

    await mongoose.disconnect();
    console.log("Disconnected.");
}

run().catch(console.error);
