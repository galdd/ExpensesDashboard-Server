import mongoose from "mongoose";
import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";
import { ExpensesModel } from "../../../routes/features/expenses/expenses.model";

export const createExpense = async (
  name: string,
  price: number,
  listName: string,
  userId: string
) => {
  const list = await ExpensesListModel.findOne({ name: listName });
  if (!list) {
    throw new Error(`List with name "${listName}" not found.`);
  }

  const newExpense = new ExpensesModel({
    name,
    price,
    listId: list._id,
    creator: new mongoose.Types.ObjectId(userId),
  });

  await newExpense.save();
  
  // Push the new expense ID into the expenses array
  list.expenses.push(newExpense._id as mongoose.Types.ObjectId);
  await list.save();

  // Populate the creator field
  await newExpense.populate("creator", "name photo");

  return { newExpense, listId: list._id };
};