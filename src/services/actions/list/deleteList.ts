import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";

export const deleteList = async (listName: string, userId: string) => {
  const list = await ExpensesListModel.findOneAndDelete({ name: listName, creator: userId });
  if (!list) {
    throw new Error(`List with name "${listName}" and userId "${userId}" not found.`);
  }

  return list;
};