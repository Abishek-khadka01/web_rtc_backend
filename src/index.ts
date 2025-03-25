import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
const app = express()
import dotenv from "dotenv"
import {Redis} from "ioredis"
import  {ConnectToDatabase, prisma}  from "./utils/database.js";
dotenv.config()
import cors from "cors"
import CookieParser from "cookie-parser"
import { HandleAnswer, HandleOffer } from "./controllers/socket.js";
import { SEND_OFFER , SEND_ANSWER } from "./constants/socket.contants.js";


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
        const user = socket.handshake.query.user as string  // it is the uuid of the user

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



io.on("connection",async (socket :SocketIO)=>{
    const user = socket.user;
    console.log(`User is connected , ${socket.id}`)

    MapSocketIdTouser.set(socket.id , socket.user as string)
    MapUserToSocket.set(user as string , socket.id)
 

    const onlineUsers = await redisClient.lrange("onlineUsers", 0, -1);
    if (!onlineUsers.includes(user as string)) {
      await redisClient.lpush("onlineUsers", user as string);
      console.log(`User ${user} added to online users.`);
    }

    socket.on(SEND_OFFER, async(socket : SocketIO)=>{
       await  HandleOffer(socket)
    })
    socket.on("SEND_ANSWER", async(socket : SocketIO)=>{
        await HandleAnswer(socket)
     })

    socket.on("disconnect", async ()=>{
        MapSocketIdTouser.delete(socket.id)
        MapUserToSocket.delete(user as string)
        await redisClient.lrem("onlineUsers",0,user as string)
    })


})

const redisClient = new Redis({
    host:"localhost",
    port:6380,
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



import { ErrorMiddleware } from "./middleware/Error.js";

import { UserRouter } from "./routes/user.routes.js";

app.use("/api/v1/users" , UserRouter)




app.use(ErrorMiddleware)


export {redisClient ,MapUserToSocket , MapSocketIdTouser}