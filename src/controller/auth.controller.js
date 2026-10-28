import { userSchema } from "../type/auth.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../model/user.db.js";

async function signup(req, res) {
    try {
        const response = userSchema.safeParse(req.body);

        if (!response.success) {
            return res.status(400).json({
                message: "please fill valide credential",
                error: response.error.message,
            });
        }

        let { username, password } = response.data;
        username = username.trim();
        password = password.trim();
        //checking username
        const existingUser = await pool.query(
            `SELECT id FROM users WHERE username = $1`,
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(404).json({
                message: "username already exist",
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            Number(process.env.SALT_SECRET)
        );

        //pushing into database
        await pool.query(
            `INSERT INTO users (username,password,balance)
             VALUES ($1,$2,$3) `,
            [username, hashedPassword, 0]
        );

        res.status(200).json({
            message: "Sign Up",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error in server",
        });
    }
}

async function signin(req, res) {
    try {
        const response = userSchema.safeParse(req.body);

        if (!response.success) {
            res.status(400).json({
                message: "please fill valide credential",
                error: response.error.message,
            });
        }
        let { username, password } = response.data;

        username = username.trim();
        password = password.trim();

        // check from database
        const result = await pool.query(
            `SELECT id , username , password 
             from users WHERE 
             username=$1 `,
            [username]
        );

        //jwt token
        const token = jwt.sign(
            { userId: result.rows[0].id },
            process.env.JWT_SECRET_KEY
        );

        const isPasswordValid = await bcrypt.compare(
            password,
            result.rows[0].password
        );

        if (isPasswordValid) {
            return res.status(200).json({
                message: "Sign In",
                token: token,
            });
        } else {
            return res.status(404).json({
                message: "Invalid credential",
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Error in server",
            error: error.message,
        });
    }
}

export { signup, signin };