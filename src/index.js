import "dotenv/config";
import express from "express";
import router from "./route/index.js";

const app = express();
app.use(express.json());

app.use("/api/v1",router)

app.listen(process.env.PORT,()=>{
    console.log(`Listening to PORT : ${process.env.PORT}`)
})
