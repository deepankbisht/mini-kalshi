import pool from "../model/user.db.js";
import { createMarketSchema, placeBetSchema } from "../type/market.js";


async function createMarket(req, res) {
    try {
        const response = createMarketSchema.safeParse(req.body);

        if (!response.success) {
            return res.status(400).json({
                message: "please fill valide credential",
                error: response.error.message,
            });
        }

        const { userId } = req;
        const { title, bet, initialAmount, expiry } = req.body;

        const userBal = await pool.query(
            `SELECT balance FROM users
            WHERE "id" =$1 `,
            [userId]
        );

        const userBalance = userBal.rows[0].balance;

        if (userBalance < initialAmount) {
            return res.status(400).json({
                success: false,
                message: "low balance can't make a bet",
            });
        }

        const result = await pool.query(
            `INSERT INTO market (title,bet,initialamount,"creatorId",expiry)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING * `,
            [title, bet, initialAmount, userId, expiry]
        );

        const updateBalance = await pool.query(
            `UPDATE users
            SET balance = balance - $2
            WHERE id = $1
            RETURNING username,balance`,
            [userId, initialAmount]
        );

        await pool.query(
            `INSERT INTO waletevents ("userId",tx_type,externalid,amount)
             VALUES ($1 , $2, $3, $4) `,
            [
                userId,
                "bet created",
                { rzpId: process.env.RZP_ID },
                initialAmount,
            ]
        );

        return res.status(201).json({
            success: true,
            market: result.rows[0],
            user: updateBalance.rows[0],
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

async function applyBets(req, res) {
    try {
        const response = placeBetSchema.safeParse(req.body);

        if (!response.success) {
            return res.status(400).json({
                message: "please fill valide credential",
                error: response.error.message,
            });
        }
        const { userId } = req;

        let { betamount } = req.body;
        const marketId = req.params.marketId;

        let marketBalance = await pool.query(
            `SELECT initialamount FROM market
             WHERE id =$1 `,
            [marketId]
        );

        const initialAmount = marketBalance.rows[0].initialamount;

        const users = await pool.query(
            `SELECT betamount FROM bets
             WHERE "marketId" =$1 `,
            [marketId]
        );

        const userBal = await pool.query(
            `SELECT balance FROM users
             WHERE "id" =$1 `,
            [userId]
        );

        const userBalance = userBal.rows[0].balance;

        const amountBet = users.rows.reduce((sum, user) => {
            return sum + Number(user.betamount);
        }, 0);

        //check balance of user
        if (userBalance < betamount) {
            return res.status(401).json({
                message: "low balance",
                balance: userBalance,
            });
        }

        const remainingBet = initialAmount - amountBet;
        if (remainingBet <= 0) {
            return res.status(200).json({
                message: "bet is full",
            });
        }

        if (remainingBet - betamount < 0) {
            betamount = remainingBet;
        }

        const updateBalance = await pool.query(
            `UPDATE users
            SET balance = balance - $2
            WHERE id = $1
            RETURNING id,username,balance`,
            [userId, betamount]
        );

        const result = await pool.query(
            `INSERT INTO bets ("userId","marketId",betamount)
             VALUES ($1, $2, $3)
             RETURNING * `,
            [userId, marketId, betamount]
        );

        await pool.query(
            `INSERT INTO waletevents ("userId",tx_type,externalid,amount)
             VALUES ($1 , $2, $3, $4) `,
            [userId, "bet applied", { rzpId: process.env.RZP_ID }, betamount]
        );

        return res.status(201).json({
            success: true,
            market: result.rows[0],
            userBalance: updateBalance.rows[0].balance,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}

async function getMarket(req, res) {
    try {
        const result = await pool.query(
            `SELECT id,title,initialamount,bet FROM market`
        );

        return res.status(200).json({
            success: true,
            profile: result.rows[0],
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
}

async function showMyBet(req, res) {
    try {
        const { userId } = req;
        const result = await pool.query(
            `SELECT id,"marketId",betamount FROM bets 
             WHERE "userId" =$1 `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            profile: result.rows[0],
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
}

export {createMarket, applyBets, getMarket ,showMyBet}