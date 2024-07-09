import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";
import mongoose from "mongoose";

export const updateList = async (oldListName: string, newListName: string, userId: string) => {
  const updatedList = await ExpensesListModel.findOneAndUpdate(
    { name: oldListName },
    { name: newListName, creator: new mongoose.Types.ObjectId(userId) },
    { new: true, runValidators: true }
  );

  if (!updatedList) {
    throw new Error(`List with name "${oldListName}" not found.`);
  }

  return updatedList;
};