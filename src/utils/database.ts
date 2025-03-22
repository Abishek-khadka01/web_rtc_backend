import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

const ConnectToDatabase = async ()=>{
    try {
        await prisma.$connect()
        console.log("Database connected")
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}



export {ConnectToDatabase, prisma}


