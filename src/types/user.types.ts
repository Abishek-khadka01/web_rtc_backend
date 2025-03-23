import {Request , Response } from "express"
import { Socket } from "socket.io"
import { JwtPayload } from "jsonwebtoken"

export type  UserFnType = (arg1 : Request, arg2: Response) => Promise<Response>

 declare global {
    
    namespace Express {
        interface Request {
            user ?: string | null
        }
    }
        interface SocketIO extends Socket {
            user ?: string
        }
    
}


 export interface JwtTokenType extends JwtPayload{
    username : string
    email : string
    password :string
}

export interface JWTUserType extends JwtPayload{
    id : string
}