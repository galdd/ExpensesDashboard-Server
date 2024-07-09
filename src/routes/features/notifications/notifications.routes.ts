import { Router, Request, Response } from "express";
import status from "http-status";
import { NotificationModel, Notification } from "./notifications.model";
import { AuthRequest } from "../../../types/@types";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.userId;

  if (!userId) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: "User not authenticated" });
  }

  const notifications = await NotificationModel.find({ userId })
    .populate("listName", "name")
    .sort({ timestamp: -1 })
    .exec();

  const formattedNotifications = notifications.map((notification) => {
    const notif = notification.toObject() as Notification & { _id: string; listName: string | { name: string } };
    return {
      id: notif._id.toString(),
      type: notif.type,
      action: notif.action,
      avatarSrc: notif.avatarSrc,
      expenseDescription: notif.expenseDescription,
      listName: typeof notif.listName === "string" ? notif.listName : (notif.listName as { name: string }).name,
      price: notif.price,
      timestamp: notif.timestamp,
      creatorName: notif.creatorName,
    };
  });

  res.status(status.OK).json(formattedNotifications);
});

router.post("/clear", async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.userId;

  if (!userId) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: "User not authenticated" });
  }

  await NotificationModel.deleteMany({ userId }).exec();

  res.status(status.OK).json({ message: "Notifications cleared successfully" });
});

export default ["/api/notifications", router] as [string, Router];