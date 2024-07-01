import { ExpensesModel } from "../../../routes/features/expenses/expenses.model";

export const updateExpense = async (id: string, name: string, price: number) => {
  const expense = await ExpensesModel.findByIdAndUpdate(id, { name, price }, { new: true });
  if (!expense) {
    throw new Error(`Expense with id "${id}" not found.`);
  }
  return expense;
};