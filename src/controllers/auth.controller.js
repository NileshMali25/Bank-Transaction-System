const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

/**
 * user register controller
 * POST - /api/auth/register
 */
async function userRegisterController(req, res) {
    console.log(req.body);
    const { email, name, password } = req.body;

    const isExists = await userModel.findOne({ email });

    if (isExists) {
        return res.status(422).json({
            message: "User already exists",
            status: "failed"
        });
    }

    const user = await userModel.create({
        email,
        password,
        name
    });

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.cookie('token', token);

    return res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    });
} 

/**
 * user login controller
 * POST - /api/auth/login
 */
async function userLoginController(req, res) {
        const { email, password } = req.body;

        const user=await userModel.findOne({ email }).select('+password');

        if(!user){
            return res.status(401).json({
                message:"Invalid email or password",
            });
        }
            const isValidPassword=await user.comparePassword(password);

            if(!isValidPassword){
                return res.status(401).json({
                    message:"Invalid email or password",
                });
            }

            const token=jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('token', token);

            return res.status(200).json({
                user: {
                    _id: user._id,
                    email: user.email,
                    name: user.name
                },
                token
            });
        }




module.exports = {
    userRegisterController,
    userLoginController
};