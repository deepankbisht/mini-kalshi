import express from "express";
import { signup, signin , addBalance , createMarket ,applyBets} from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const userRouter = express.Router();

userRouter.post("/signup",signup);

userRouter.post("/signin",signin);

userRouter.post("/onramp", authMiddleware, addBalance);

userRouter.post("/market",authMiddleware, createMarket);

userRouter.post("/bets/:marketId",authMiddleware, applyBets);   

export default userRouter;
