import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../types/@types";

export const extractUserInfo = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (authReq.auth) {
    authReq.user = {
      sub: authReq.auth.payload.sub,
    };
  }
  // next();
};