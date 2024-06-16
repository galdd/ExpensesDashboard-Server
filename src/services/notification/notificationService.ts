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
}

export const createAndEmitNotification = async ({
  userId,
  type,
  action,
  listId,
  listName,
  creatorName,
  avatarSrc,
}: NotificationProps) => {
  const io = getIO();

  const notification = new NotificationModel({
    userId,
    type,
    action,
    avatarSrc,
    listName: listId,
    timestamp: new Date().toISOString(),
    creatorName,
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
    },
  });
};