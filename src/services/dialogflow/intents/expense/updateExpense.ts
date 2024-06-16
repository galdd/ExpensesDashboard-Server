import { ExpensesModel } from "../../../../routes/features/expenses/expenses.model"

export const updateExpense = async (id: string, name: string, amount: number) => {
  const expense = await ExpensesModel.findByIdAndUpdate(id, { name, amount }, { new: true });
  if (!expense) {
    throw new Error(`Expense with id "${id}" not found.`);
  }
  return expense;
};