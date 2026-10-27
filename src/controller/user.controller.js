import { userSchema } from "../util/user.z.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../connection/user.db.js";
import { success } from "zod";
import { fa } from "zod/locales";


async function signup(req,res){
    try {
        const response = userSchema.safeParse(req.body);

        if(!response.success){
            return res.status(400).json({
                message:"please fill valide credential",
                error : response.error.message
            })
        }

        const {username,password} = response.data ;
        //checking username 
        const existingUser = await pool.query(
            `SELECT id FROM users WHERE username = $1`,
            [username]
        )

        if(existingUser.rows.length>0){
            return res.status(404).json({
                message : "username already exist"
            })
        }

        const hashedPassword = await bcrypt.hash(password , Number(process.env.SALT_SECRET ));
        console.log(hashedPassword);
        //pushing into database
        await pool.query(
            `INSERT INTO users (username,password,balance)
             VALUES ($1,$2,$3) `,
            [username , hashedPassword,0]  
        );

        res.status(200).json({
            message:"Sign Up"
        })
    } catch (error) {
        res.status(500).json({
            message :"Error in server"
        })
    }
}


async function signin(req,res){
    try {
        const response = userSchema.safeParse(req.body);

        if(!response.success){
            res.status(400).json({
                message:"please fill valide credential",
                error : response.error.message
            })
        }
        const {username,password} = response.data ;
        

        // check from database
        const result = await pool.query(
            `SELECT id , username , password 
             from users WHERE 
             username=$1 `,
            [username]
        )

        //jwt token
        const token = jwt.sign({userId : result.rows[0].id},process.env.JWT_SECRET_KEY);

        const isPasswordValid = await bcrypt.compare(password, result.rows[0].password);

        if(isPasswordValid){
            res.status(200).json({
                message:"Sign In",
                token : token
            })    
        }else{
            res.status(404).json({
                message:"Invalid credential"
            })
        }
    } catch (error) {
        res.status(500).json({
            message :"Error in server"
        })
    }
}

async function addBalance(req,res){
    try {
        const { userId } = req;
        const result = await pool.query(
            `UPDATE users
            SET balance = balance + 50
            WHERE id = $1
            RETURNING id,username,balance`,
            [userId]
        )
        if(result.rows.length==0){
            return res.status(400).json({
                message:"Not Found"
            })
        }

        return res.status(200).json({
            message: "balance increased by 50",
            user : result.rows[0]
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

async function createMarket(req,res){
    try {
        const {userId} = req;
        const {title,bet,initialAmount,expiry} = req.body;

        const result = await pool.query(
            `INSERT INTO market (title,bet,initialamount,"creatorId",expiry)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING * `,
             [title,bet,initialAmount,userId,expiry]
        )

        return res.status(201).json({
            success: true,
            market: result.rows[0]
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

async function applyBets(req,res){
    try {
        const {userId} = req;
        let {betamount} = req.body;
        const marketId = req.params.marketId;

        let marketBalance = await pool.query(
            `SELECT initialamount FROM market
             WHERE id =$1 `,
             [marketId]
        )

        const initialAmount = marketBalance.rows[0].initialamount;

        const users = await pool.query(
            `SELECT betamount FROM bets
             WHERE "marketId" =$1 `,
             [marketId]
        )

        const amountBet = users.rows.reduce((sum,user)=>{
            return sum+Number(user.betamount);
        },0)
        
        const remainingBet = initialAmount - amountBet;
        if(remainingBet<=0){
            return res.status(200).json({
                message: "bet is full"
            })
        }

        if(remainingBet-betamount<0){
            betamount = remainingBet;
        }

        const updateBalance = await pool.query(
            `UPDATE users
            SET balance = balance - $2
            WHERE id = $1
            RETURNING id,username,balance`,
            [userId,betamount]
        )

        const result = await pool.query(
            `INSERT INTO bets ("userId","marketId",betamount)
             VALUES ($1, $2, $3)
             RETURNING * `,
             [userId,marketId,betamount]
        )

        return res.status(201).json({
            success: true,
            market: result.rows[0],
            userBalance: updateBalance.rows[0].balance
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

export {signup ,signin ,addBalance ,createMarket , applyBets }