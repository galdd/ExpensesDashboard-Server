import { ExpensesListModel } from "../../../../routes/features/expenses-list/expenses-list.model";

export const updateList = async (oldName: string, newName: string, originalQuery: string) => {
  const originalOldName = getOriginalListName(originalQuery, oldName);
  const originalNewName = getOriginalListName(originalQuery, newName);
  const list = await ExpensesListModel.findOne({ name: originalOldName });
  if (!list) {
    throw new Error(`List with name "${originalOldName}" not found.`);
  }
  list.name = originalNewName;
  await list.save();
  return list;
};

const getOriginalListName = (query: string, listName: string) => {
  const regex = new RegExp(`\\b${listName}\\b`, 'i');
  const match = query.match(regex);
  return match ? match[0] : listName;
};