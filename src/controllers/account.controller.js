const accountModel = require('../models/account.model');

async function createAccount(req, res) {
    const user=req.user;

    const account=await accountModel.create({
        user:user._id,
    }); 

    res.status(201).json({
        message:"Account created successfully",
        account
    });
}

async function getUserAccountController(req,res){
    const accounts=await accountModel.find({user: req.user._id})

    res.status(200).json({
        accounts
    })
}

module.exports={createAccount,getUserAccountController};