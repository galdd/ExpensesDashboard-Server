import { ExpensesModel } from "../../../../routes/features/expenses/expenses.model"

export const deleteExpense = async (id: string) => {
  const expense = await ExpensesModel.findByIdAndDelete(id);
  if (!expense) {
    throw new Error(`Expense with id "${id}" not found.`);
  }
  return expense;
};