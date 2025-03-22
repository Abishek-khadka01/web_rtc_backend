import jwt from "jsonwebtoken";


export const CreateOneTimeToken = (email: string , username : string, password : string)=>{

    return jwt.sign({email , username, password} , process.env.JWT_SECRET as string , {expiresIn : "5m"})

}

