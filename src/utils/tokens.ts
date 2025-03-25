import jwt from "jsonwebtoken";
import { JWTUserType } from "types/user.types";


export const CreateOneTimeToken = (email: string , username : string, password : string)=>{

    return jwt.sign({email , username, password} , process.env.JWT_SECRET as string , {expiresIn : "1hr"})

}


export const CreateTokens = (id : string )=>{

const accessToken = jwt.sign({id} , process.env.ACCESS_TOKEN_SECRET as string , {expiresIn : "1hr"})
const refreshToken= jwt.sign({id} , process.env.REFRESH_TOKEN_SECRET as string , {expiresIn : "15d"})

return {
    accessToken, 
    refreshToken
}

}



export const CreateAccessToken = async (refreshToken : string )=>{
    
    const token: JWTUserType | null =  jwt.verify(refreshToken , process.env.REFRESH_TOKEN_SECRET as string) as JWTUserType

    const accessToken = jwt.sign({id : token.id} , process.env.ACCESS_TOKEN_SECRET as string , {expiresIn : "15m"})


    return {
        accessToken,
        refreshToken,
        id : token.id
    }

}