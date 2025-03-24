
import { redisClient } from "../index.js";
import { JwtTokenType, UserFnType } from "../types/user.types.js";
import { prisma } from "../utils/database.js";
import { SendMail } from "../utils/nodemailer.js";
import { CreateOneTimeToken, CreateTokens } from "../utils/tokens.js";
import { UserLoginValidator, UserRegisterValidator } from "../validators/user.validators.js";
import { ComparePassword, HashPassword } from "utils/hash.js";
import jwt from "jsonwebtoken"
 export const GetOnlineUsers : UserFnType=async  (req , res )=>{


    try {
        const {user} = req;
        const GetData = await redisClient.lrange("onlineUsers", 0 , -1);

        if(!GetData){
            console.log("No online users")
            return res.status(401).json({
                success :false,
                message :"No online users"
            })
        }

            // get the data without including the user

            const Online = GetData.filter((id)=>{
                return id !== user
            })

    const PromiseResponseData =   Online.map((id)=>{
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
    data:{
        onlineUsers : PromiseResponseData
    }
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
        const hashedPassword = password
        //  await HashPassword(password)

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

export const UserLogin : UserFnType = async (req ,res)=>{
    console.log(`User Login Api is running `)

    try {
        const validate = UserLoginValidator.validate(req.body)
        if(validate.error){

            console.log(`Error in the validation ${validate.error.message}`)
            return res.status(301).json({
                success : false,
                message : validate.error.message
            })
        }
        const {email, password } = req.body;

        const findUser = await prisma.users.findUnique({
            where :{
                email ,
            },
            
        })
        if(!findUser){
            console.log(`the user is not found `)
            return res.status(401).json({
                success : false,
                message :"Invalid Credentials "
            })
        }


        const isPasswordCorrect = password===findUser.password 
        
        // await ComparePassword(password, findUser.password)
        if(!isPasswordCorrect){
            console.log(`Password is not correct `)
            return res.status(401).json({
                success :false,
                message :"Invalid Credentials "
            })
        }
        // create tokens 
        const {accessToken, refreshToken } = CreateTokens(findUser.id)


            res.cookie("accessToken" , accessToken, {
                httpOnly : true,
                secure : true,
                sameSite : "none",
                maxAge: 1000 * 60 * 60
            }).cookie("refreshToken" , refreshToken, {
                httpOnly : true,
                secure : true,
                sameSite : "none",
                maxAge: 1000 * 60 * 60* 24*15
            })

            console.log(`User Logged in Successfully`)
        return res.status(200).json({
            success : true ,
            message :"User logged in successfully",
            tokens :{
                accessToken, 
                refreshToken
            },
            user : findUser,
        })
        
    } catch (error) {
        console.log(`Error in the logging the user`)
        return res.status(500).json({
            success : false,
            message :`Error in the logging the user ${error} `
        })
    }


}

export const UserLogOut  : UserFnType = async (req , res)=>{

        try {
            const {user} = req;
            

            if(!user){
                console.log("User is not logged in")
                return res.status(401).json({
                    success :false,
                    message :"User is not logged in"
                })
            }
                const findUser = await prisma.users.findUnique({
                    where :{
                        id : user
                    }
                })
                if(!findUser){
                    console.log("User is not found")
                    return res.status(404).json({
                        success :false,
                        message :"User is not found"
                    })
                }


            await redisClient.del("onlineUsers", user)
                req.user = null


            return res.status(200).json({
                success : false,
                message :"User logged out successfully"
            })
        } catch (error) {
            console.log(`Error in logging out the user ${error}`)
            return res.status(500).json({
                success :false,
                message :"Error in logging out the user"
            })
        }

}

export const GetUserbyId  : UserFnType = async (req , res)=>{

    try {

        const {user} = req;
        if(!user){
            console.log(`The user is not logged in properly `)
            return res.status(401).json({
                success :false,
                message :"User is not authenticated "
            })
        }

            const id  = req.query.id as string;
        const findUser = await prisma.users.findUnique({
            where :{
                id ,
            }, select :{
                id : true,
                username : true,
                email : true,
                profile_picture: true
            }
        })
        if(!findUser){
            console.log(`The user is not found `)
            return res.status(404).json({
                success :false,
                message :"User is not found"
            })
        }



        return res.status(200).json({
            success :true,
            message :"User found successfully",
            
        })
    } catch (error) {
        console.log(`Error in getting the details of the user`)
        return res.status(500).json({
            success : false,
            message :`Internal Server Errorn ${error}`
        })
    }




}