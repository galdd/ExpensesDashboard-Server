import { Types } from "mongoose";
import { NotificationModel } from "../../routes/features/notifications/notifications.model";
import { getIO } from "../socket";

interface NotificationProps {
  userId: string;
  type: string;
  action: string;
  listId: Types.ObjectId;
  listName: string;
  creatorName: string;
  avatarSrc: string;
  expenseDescription?: string;
  price?: number;
}

export const createAndEmitNotification = async ({
  userId,
  type,
  action,
  listId,
  listName,
  creatorName,
  avatarSrc,
  expenseDescription,
  price,
}: NotificationProps) => {
  const io = getIO();

  const notification = new NotificationModel({
    userId,
    type,
    action,
    avatarSrc,
    listName, 
    timestamp: new Date().toISOString(),
    creatorName,
    expenseDescription,
    price,
  });

  await notification.save();

  io.emit("notification", {
    type,
    props: {
      id: listId.toString(),
      avatarSrc,
      listName,
      creatorName,
      timestamp: new Date().toISOString(),
      action,
      expenseDescription,
      price,
    },
  });
};