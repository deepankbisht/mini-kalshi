import pool from "../model/user.db.js";
import { resolveMarketSchema } from "../type/resolve.js";


async function addBalance(req, res) {
    try {
        const { userId } = req;
        const result = await pool.query(
            `UPDATE users
            SET balance = balance + 50
            WHERE id = $1
            RETURNING id,username,balance`,
            [userId]
        );
        if (result.rows.length == 0) {
            return res.status(400).json({
                message: "Not Found",
            });
        }

        await pool.query(
            `INSERT INTO waletevents ("userId",tx_type,externalid,amount)
             VALUES ($1 , $2, $3, $4) `,
            [userId, "add balance", { binanceId: process.env.BINANCE_ID }, 50]
        );

        return res.status(200).json({
            message: "balance increased by 50",
            user: result.rows[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}



async function waletEvents(req, res) {
    try {
        const { userId } = req;
        const users = await pool.query(
            `SELECT u.username,w.tx_type,w.externalid,w.amount 
             FROM waletEvents AS w
             JOIN users AS u ON w."userId" = u.id
             WHERE w."userId" =$1 
             ORDER BY w.id DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            tx_history: users.rows,
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

async function profile(req, res) {
    try {
        const { userId } = req;

        const result = await pool.query(
            `SELECT username,balance FROM users
             WHERE id = $1 `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            profile: result.rows[0],
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
}

async function resolveBet(req, res) {
    try {
        const response = resolveMarketSchema.safeParse(req.body);

        if (!response.success) {
            return res.status(400).json({
                message: "please fill valide credential",
                error: response.error.message,
            });
        }

        const { marketId } = req.params;

        const check = await pool.query(
            `SELECT resolution FROM market
             WHERE id = $1`,
             [marketId]
        )

        if(check.rows[0].resolution !== null){
            return res.status(404).json({
                success: false,
                message:"this market is resolved"
            })
        }

        const admId = req.userId;
        const adm = await pool.query(
            `SELECT username FROM users 
             WHERE id = $1 `,
            [admId]
        );

        const admin = adm.rows[0].username;
        if (admin !== "admin") {
            return res.status(404).json({
                success: false,
                message: "Access denied only admin can resolve bet",
            });
        }

        const { result } = response.data;

        await pool.query(
            `UPDATE market 
             SET resolution = $1
             WHERE id=$2 `,
             [result,marketId]
        )

        const ans = await pool.query(
            `SELECT bet,initialamount,"creatorId" FROM market
             WHERE id=$1 `,
            [marketId]
        );

        const bet = ans.rows[0].bet;
        const initialamount = ans.rows[0].initialamount;
        const userId = ans.rows[0].creatorId;

        const total = await pool.query(
            `SELECT betamount FROM bets 
             WHERE id=$1 `,
            [marketId]
        );

        const totalBet = total.rows.reduce((sum, user) => {
            return sum + Number(user.betamount);
        }, 0);

        if (result === bet) {
            const final = await pool.query(
                `UPDATE users AS u
                 SET balance = u.balance + $1 + $2
                 FROM market AS m
                 WHERE u.id = m."creatorId" 
                 AND m.id = $3 
                 RETURNING u.username,u.balance,($1::bigint + $2::bigint) AS payout`,
                [totalBet, initialamount, marketId]
            );

            await pool.query(
                `INSERT INTO waletevents ("userId",tx_type,externalid,amount)
                 VALUES ($1 , $2, $3, $4) `,
                [
                    userId,
                    "bet Won",
                    { rzpId: process.env.RZP_ID },
                    BigInt(totalBet)+BigInt(initialamount),
                ]
            );

            return res.status(200).json({
                success: true,
                message: final.rows[0],
            });
        } else {
            const final = await pool.query(
                `WITH payouts AS (
                    SELECT "userId", SUM(betamount * 2) AS payout
                    FROM bets
                    WHERE "marketId" = $1
                    GROUP BY "userId"
                )
                 UPDATE users AS u
                 SET balance = u.balance + p.payout
                 FROM payouts as p
                 WHERE u.id = p."userId"
                 RETURNING u.id,u.username,p.payout,u.balance `,
                [marketId]
            );


            for (const use of final.rows) {
                await pool.query(
                    `INSERT INTO waletevents ("userId",tx_type,externalid,amount)
                     VALUES ($1 , $2, $3, $4) `,
                    [
                        use.id,
                        "bet Won",
                        { rzpId: process.env.RZP_ID },
                        use.payout.toString(),
                    ]
                );
            }

            await pool.query("COMMIT");

            return res.status(200).json({
                success: true,
                message: final.rows
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}

export {
    addBalance,
    waletEvents,
    profile,
    resolveBet,
};
