const mongoose=require('mongoose');
const ledgerModel = require('./ledger.model');

const accountSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:[true, "Account must be associated with a user"],
        index:true
    },
    status:{
        type:String,
         enum:{
        values:[ "ACTIVE", "FROZEN", "CLOSED"],
        message:"Status must be either ACTIVE, FROZEN, or CLOSED",
         },
        default:"ACTIVE",
         
    },
    currency:{
        type:String,
        required:[true, "Currency is required"],
        default:"INR"
    }
    
},{
        timestamps:true
    }

);

accountSchema.index({ user: 1, status: 1 });// Create a compound index on user and status fields

accountSchema.methods.getBalance = async function() {
    const ledgerEntries = await ledgerModel.find({ account: this._id });
    let balance = 0;
    for (const entry of ledgerEntries) {
        if (entry.type === 'CREDIT') {
            balance += entry.amount;
        } else if (entry.type === 'DEBIT') {
            balance -= entry.amount;
        }
    }
    return balance;
};

const accountModel=mongoose.model('account', accountSchema);

module.exports=accountModel;