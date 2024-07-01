import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";
import { NotificationModel } from "../../../routes/features/notifications/notifications.model";

export const deleteList = async (id: string) => {
  const list = await ExpensesListModel.findByIdAndDelete(id);
  if (!list) {
    throw new Error(`List with id "${id}" not found.`);
  }

  // Create a notification for the deletion of the list
  const notification = new NotificationModel({
    userId: list.creator,
    type: "list", // Set to "list" to match the updated Notification model
    action: "remove", // Set to "remove" for deletion actions
    listName: list.name,
    avatarSrc: "", // Set a default or fetch the photo if available
    timestamp: new Date().toISOString(),
    creatorName: "", // Set a default or fetch the creator name if available
  });
  await notification.save();

  return list;
};