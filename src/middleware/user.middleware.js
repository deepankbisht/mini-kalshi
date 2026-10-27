import jwt from "jsonwebtoken"
import "dotenv/config";

function authMiddleware(req,res,next){
    try {
        const token = req.headers.token;
        const user = jwt.verify(token,process.env.JWT_SECRET_KEY);   
        req.userId = user.userId;
        next();
    } catch (error) {
        console.log(error,"got it ");
    }
}

export {authMiddleware}