import { MapUserToSocket } from ".././index.js";
import { RECEIVE_OFFER } from "../constants/socket.contants.js";
import { prisma } from "../utils/database.js";


export const HandleOffer = async (socket : SocketIO )=>{

    const { from , to, offer , url } = socket.data
    
    const toSocketid = MapUserToSocket.get(to);
   

        const Sender  = await prisma.users.findUnique(
            {
                where :
                {id : from

                }, select:{
                    username: true,
                    profile_picture : true,
                    id: true
                }})


    if(toSocketid){
        socket.to(toSocketid).emit(RECEIVE_OFFER , {
            offer,
            sender : Sender,
            url 
            
        })
    }




}


export const HandleAnswer = async (socket : SocketIO)=>{

    const {from , to , answer} = socket.data


    const toSocketid = MapUserToSocket.get(to)

    if(toSocketid){
        socket.to(toSocketid).emit("RECEIVE_ANSWER" , {
            from ,
            answer
        })
    }



}