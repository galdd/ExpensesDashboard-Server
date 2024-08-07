// middlewares/index.ts
import * as dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { UserModel, User } from "../features/users/users.model";
import { AuthRequest } from "../../types/@types";

dotenv.config();

export const checkJwt = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  audience: `${process.env.AUTH0_AUDIENCE}`,
});

export const extractUserInfo = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.auth) {
    req.user = {
      sub: req.auth.payload.sub,
    };
  }
  next();
};

export const checkUserExists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    if (!res.headersSent) {
      res.status(401).json({ message: "User not authenticated." });
    }
    return;
  }

  const { sub } = req.user;
  const user = await UserModel.findOne({ auth0Id: sub }) as User | null;

  if (!user) {
    if (!res.headersSent) {
      res
        .status(401)
        .json({ message: "User not found. Please register first." });
    }
    return;
  }

  req.userId = user._id.toString();
  if (!res.headersSent) {
    next();
  }
};