import "dotenv/config";
import jwt from "jsonwebtoken"


function authMiddleware(req,res,next){
    try {
        const token = req.headers.token;
        const user = jwt.verify(token,process.env.JWT_SECRET_KEY);   
        req.userId = user.userId;
        next();
    } catch (error) {
        return res.status(404).json({
            success:false,
            message: error.message
        })
    }
}

export {authMiddleware}