import { Request, Response, NextFunction } from "express";
import { UserModel, User } from "../features/users/users.model";
import { AuthRequest } from "../../types/@types";

export const checkUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authReq = req as AuthRequest;
  if (!authReq.user) {
    if (!res.headersSent) {
      res.status(401).json({ message: "User not authenticated." });
    }
    return;
  }

  const { sub } = authReq.user;
  const user = await UserModel.findOne({ auth0Id: sub }) as User | null;

  if (!user) {
    if (!res.headersSent) {
      res
        .status(401)
        .json({ message: "User not found. Please register first." });
    }
    return;
  }

  authReq.userId = user._id.toString();
  if (!res.headersSent) {
//     next();
  }
};