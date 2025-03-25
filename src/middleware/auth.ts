import { JWTUserType } from "../types/user.types.js";

import { CreateAccessToken } from "../utils/tokens.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";


type HandleVerification =   (token: string, secret: string, tokenType: string) => JWTUserType | null ;

const handleTokenVerification: HandleVerification =  (token, secret, tokenType) => {
  try {
    console.log(`Handle token verification working `)
    console.log(`Secret is ${process.env.ACCESS_TOKEN_SECRET}`)
    const decoded =   jwt.verify(token, secret) as JWTUserType;
    console.log(decoded)
    if (!decoded) {
      throw new Error(`${tokenType} is invalid`);
    }

      console.log(`Decoded token is ${decoded.id}`)
      console.log(typeof decoded._id)
    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.log(`${tokenType} verification failed: ${error.message}`);
    } else {
      console.log(`${tokenType} verification failed due to an unexpected error: ${error}`);
    }
    return null;
  }
};

export const AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("AuthMiddleware endpoint was hit");

    const { accessToken, refreshToken } = req.cookies;
    if (!accessToken && !refreshToken) {
      console.log("No tokens found in cookies");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Handle missing access token but present refresh token
    if (!accessToken) {


        if(!refreshToken){
          console.log(`No refreshToken too `)
          res.status(401).json({
            success : false,
            message :"No  tokens"
          })
        }else{
      const refreshDecoded = handleTokenVerification(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET as string,
        "Refresh Token"
      );

      if (!refreshDecoded) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - Refresh token invalid",
        });
      }
      }

      
        // Recreate access token
        console.log(`Recreating the accesstoken from the refresh token `)
        const { accessToken : newAccessToken, id } = await CreateAccessToken(refreshToken as string );

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        req.user = id;
 
         next();
    
    }else{

    // If the access token exists, verify it
    const accessDecoded = handleTokenVerification(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET as string,
      "Access Token"
    );

    if (!accessDecoded) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Access token invalid",
      });
    }

    req.user = accessDecoded.id;
    next();
  }
  } catch (error) {
    console.log(`Error in AuthMiddleware: ${error}`);
    next(error);
  }
};