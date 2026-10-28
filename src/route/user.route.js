import express from "express";
import { addBalance , waletEvents , profile  , resolveBet} from "../controller/user.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const userRouter = express.Router();

//user
userRouter.get("/profile",authMiddleware,profile);

//balance
userRouter.post("/onramp", authMiddleware, addBalance);
userRouter.get("/transactions",authMiddleware,waletEvents);

//market
userRouter.post("/resolve/:marketId",authMiddleware,resolveBet);

export default userRouter;
