import { Router } from "express";

import { UserLogin, GetOnlineUsers, GetUserbyId } from "../controllers/user.controller.js";
import { AuthMiddleware } from "../middleware/auth.js";


const UserRouter = Router()


UserRouter.post("/login", UserLogin)

UserRouter.get("/online-users", AuthMiddleware,  GetOnlineUsers )
UserRouter.get("/details/:id", AuthMiddleware,  GetUserbyId )

export {UserRouter}