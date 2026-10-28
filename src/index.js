import "dotenv/config";
import express from "express";
import userRouter from "./route/user.route.js";


const app = express();
app.use(express.json());

app.use("/user",userRouter);

app.listen(process.env.PORT,()=>{
    console.log(`Listening to PORT : ${process.env.PORT}`)
})
