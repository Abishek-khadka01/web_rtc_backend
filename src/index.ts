import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
const app = express()
import dotenv from "dotenv"
import {Redis} from "ioredis"
import  {ConnectToDatabase}  from "./utils/database";
dotenv.config()
import cors from "cors"
import CookieParser from "cookie-parser"

import { Socket } from "dgram";
import { prisma } from "./utils/database";

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
  
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(CookieParser())

const httpServer = createServer(app);


const io = new Server(httpServer, {
  cors:{
    origin:"http://localhost:5173",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
  }
});

io.use( async (socket : SocketIO, next)=>{

    try {
        const user = socket.handshake.auth.user // it is the uuid of the user

        const findUser = await prisma.users.findUnique({
            where : {
                id: user
            }
        })

        if(!findUser){
            throw new Error("User not found")
        }

        socket.user = user
        next()



    } catch (error) {
        socket.emit("error", {
            message : `Error occured in the socket middleware ${error}`
        })
    }


})

const MapUserToSocket = new Map<string, string>()
const MapSocketIdTouser = new Map<string , string>()



io.on("connection", (socket :SocketIO)=>{
    console.log(`User is connected , ${socket.id}`)


})

const redisClient = new Redis({
    host:"localhost",
    port:6379,
})
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
});

redisClient.on("connect", ()=>{
    console.log(`The redis is connected at ${redisClient.options.host}:${redisClient.options.port}`)
})

redisClient.on("disconnect", ()=>{
    console.log(`the redis is disconnected `)
})

redisClient.on("error", (error)=>{
    console.log(`Error in redis ${error.message}` )
})


ConnectToDatabase()


const PORT = process.env.PORT || 3000
httpServer.listen(PORT , ()=>{
    console.log(`App is listening at port ${PORT}`)
});



import { ErrorMiddleware } from "middleware/Error";


app.use(ErrorMiddleware)


export {redisClient ,MapUserToSocket , MapSocketIdTouser}