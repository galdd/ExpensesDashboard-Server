import { ExpensesListModel } from "../../../../routes/features/expenses-list/expenses-list.model";

export const readLists = async () => {
  const lists = await ExpensesListModel.find();
  return lists;
};