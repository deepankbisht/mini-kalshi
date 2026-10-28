import { Router } from "express";
import userRouter from "./user.route.js";
import authRouter from "./auth.route.js";
import marketRouter from "./market.route.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/market", marketRouter);

export default router;
