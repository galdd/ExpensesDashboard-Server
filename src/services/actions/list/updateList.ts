import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";
import mongoose from "mongoose";

export const updateList = async (id: string, name: string, userId: string) => {
  const updatedList = await ExpensesListModel.findByIdAndUpdate(
    id,
    { name, creator: new mongoose.Types.ObjectId(userId) },
    { new: true, runValidators: true }
  );
  return updatedList;
};