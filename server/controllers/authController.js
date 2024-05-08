import User from '../models/userModel.js';
import { errorHandler } from "../utils/errorHandler.js";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const signup = async (req, res, next) => {
    // save the username, email and password 
    // that come from req.body
    const { username, email, password } = req.body;

    if (
        !username ||
        !email ||
        !password || 
        username === "" || 
        email ==="" || 
        password === ""
    ) {
        next(errorHandler(400, 'All Fields are required!'));
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);

    const newUser = new User({
        username,
        email,
        password: hashedPassword,
    })

    try {
        await newUser.save();
        res.status(201).json('Signup successful');
    } catch (error) {
        next(error);
    }
}

export const signin = async (req, res, next) => {
    // only get the email and password;

    const { email, password } = req.body;

    // if the user doesn't provide the necessary credentials
    // throw an error.
    if (!email || !password || email === "" || password === "") {
        next(errorHandler(400, 'All fields are required!'));
    }

    // try to log the user in using a
    // try-catch block
    try {
        // set a variable called validUser and the 
        // program will check if it's actually valid or not
        // use await to get the response

        // look at their email in the DB to check
        // if the user has account
        const validUser = await User.findOne({ email });

        // if the user doesn't have an account, throw an error.
        if (!validUser) {
            return next(errorHandler(404, 'User not found!'));
        }

        const validPassword = bcryptjs.compareSync(password, validUser.password);

        if (validPassword === false) {
            return next(errorHandler(400, 'Invalid Password'))
        }

        const token = jwt.sign(
            // _id comes from MongoDB
            {id: validUser._id},
            process.env.JWT_TOKEN
        );

        // this code will send the cookie without the password
        const { password: pass, ...rest } = validUser._doc;

        // set the cookie and send the cookie without 
        // the password (send the rest);
        res.status(200).cookie('access_token', token, {
            httpOnly: true,
        }).json({
            ...rest,
            message: `Signed in ${validUser.username} successfully!`
        });
    } catch (error) {
        next(error);
    }
}