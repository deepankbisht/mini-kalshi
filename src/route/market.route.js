import express from "express";
import { authMiddleware } from "../middleware/user.middleware.js";
import {
    applyBets,
    createMarket,
    getMarket,
    showMyBet,
} from "../controller/market.controller.js";

const marketRouter = express.Router();

marketRouter.post("/", authMiddleware, createMarket);
marketRouter.post("/bets/:marketId", authMiddleware, applyBets);
marketRouter.get("/", authMiddleware, getMarket);
marketRouter.get("/bet", authMiddleware, showMyBet);

export default marketRouter;
