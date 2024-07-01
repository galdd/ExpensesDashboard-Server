import { ExpensesModel } from "../../../routes/features/expenses/expenses.model";
import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";

export const deleteExpense = async (expenseId: string, listId: string) => {
  const expense = await ExpensesModel.findByIdAndDelete(expenseId);
  if (!expense) {
    throw new Error(`Expense with id "${expenseId}" not found.`);
  }

  const list = await ExpensesListModel.findById(listId);
  if (!list) {
    throw new Error(`List with id "${listId}" not found.`);
  }

  list.expenses = list.expenses.filter(expId => expId.toString() !== expenseId);
  await list.save();

  return { expenseId, listId };
};