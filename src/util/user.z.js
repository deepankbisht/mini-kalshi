import {z} from "zod";

const userSchema = z.object({
    username: z.string().trim().min(4).max(100),
    password: z.string().trim().min(4).max(200) 
})

export {userSchema} 