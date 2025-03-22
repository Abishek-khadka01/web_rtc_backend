
import { redisClient } from "index";
import { JwtTokenType, UserFnType } from "types/user.types";
import { prisma } from "utils/database";
import { SendMail } from "utils/nodemailer";
import { CreateOneTimeToken } from "utils/tokens";
import { UserRegisterValidator } from "validators/user.validators";
import { HashPassword } from "utils/hash";
import jwt from "jsonwebtoken"
 export const GetOnlineUsers : UserFnType=async  (req , res )=>{


    try {
        const GetData = await redisClient.lrange("onlineUsers", 0 , -1);

        if(!GetData){
            console.log("No online users")
            return res.status(401).json({
                success :false,
                message :"No online users"
            })
        }


    const PromiseResponseData =   GetData.map((id)=>{
                return prisma.users.findUnique({
                    where :{
                        id
                    }, select:{
                        id : true,
                        username : true,
                        email : true,
                        profile_picture : true
                    }
                })
        })

        const responseData = await Promise.all(PromiseResponseData)

return res.status(200).json({
    success : true,
    message : `Online users found`,
    users : responseData
})



    } catch (error) {
        console.log(`Error in getting the online users ${error}` )
        return res.status(500).json({
            success :false,
            message : error
        })
    }

}

export const UserRegister :UserFnType = async (req , res)=>{
    try {
        

        const validate = UserRegisterValidator.validate(req.body)
        if(validate.error){
            console.log(`Error in the validation ${validate.error.message}`)
            return res.status(301).json({
                success : false,
                message : validate.error.message
            })
        }



            const {username , email , password} = req.body;
        const hashedPassword = await HashPassword(password)

        const jwtToken = CreateOneTimeToken(email, username, hashedPassword)

       await  SendMail(email, jwtToken)


       return res.status(200).json({
        success :true,
        message : "Otp is sent to your mail.The code expires in 5 min ",

       })




    } catch (error) {
        console.log(`Error in registering the user ${error}` )
        return res.status(500).json({
            success :false,
            message : error
        })
    }

} 


export const RegisterFromMail : UserFnType = async (req , res)=>{

 try {
    const {username , email , token } = req.body        

    const jwtTokenDecode : JwtTokenType | null =jwt.decode(token) as JwtTokenType
    
    if(!jwtTokenDecode){
        console.log("Invalid token")
        return res.status(401).json({
            success :false,
            message :"Token expired or donot exist"
        })
    }


    if(jwtTokenDecode.email !== email || jwtTokenDecode.username !== username){
        console.log("Invalid token")
        return res.status(401).json({
            success :false,
            message :"Invalid token"
        })
    }


      const createUser = await prisma.users.create({
        data :{
            username : jwtTokenDecode.username,
            email : jwtTokenDecode.email,
            password : jwtTokenDecode.password
        }
      })



        return res.status(200).json({
            success : true,
            message : "User registered successfully",
            user: createUser

        })
    } catch (error) {
        console.log(`Error in registering from the mail ${error}` )
        return res.status(500).json({
            success :false,
            message :`Error in registering from the mail ${error}`  
        })
    }

}

