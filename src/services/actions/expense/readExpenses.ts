import { ExpensesModel } from "../../../routes/features/expenses/expenses.model";

export const readExpenses = async (listId: string) => {
  const expenses = await ExpensesModel.find({ listId }).populate("creator", "name photo");
  return expenses;
};