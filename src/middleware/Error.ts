import {Request , Response ,NextFunction } from "express";


export const ErrorMiddleware = (err : Error  ,req : Request , res : Response , next : NextFunction )=>{
    
if(err){
    res.status(500).json({
        success :false,
        message : err.message || "Internal Server Error"
    })
}


}