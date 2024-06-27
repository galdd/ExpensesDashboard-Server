// deleteExpense.js

import { ExpensesListModel } from "../../../../routes/features/expenses-list/expenses-list.model";
import { ExpensesModel } from "../../../../routes/features/expenses/expenses.model";

export const deleteExpense = async (id: string) => {
  const expense = await ExpensesModel.findByIdAndDelete(id);
  if (!expense) {
    throw new Error(`Expense with id "${id}" not found.`);
  }
  const list = await ExpensesListModel.findById(expense.listId);
  if (list) {
    list.expenses.pull(expense._id);
    await list.save();
  }
  return expense;
};