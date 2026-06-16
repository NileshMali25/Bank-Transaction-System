const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const tokenBlackListModel=require("../models/blacklist.model")
async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token not found",
            status: "failed"
        });
    }

    const isBlacklisted=await tokenBlackListModel.findOne({token})

    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access,token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        req.user = user;
        return next();

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, invalid token",
            status: "failed"
        });
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token not found",
            status: "failed"
        });
    }

    const isBlacklisted=await tokenBlackListModel.findOne({token})

    if(isBlacklisted){
        return res.status(401).json({
            message:"Unauthorized access,token is invalid"
        })
    }


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId).select('+systemUser');

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Unauthorized access, only system users can perform this action",
                status: "failed"
            });
        }

        req.user = user;
        return next();

    }
    catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, invalid token",
            status: "failed"
        });
    }

}

    module.exports = { authMiddleware, authSystemUserMiddleware }