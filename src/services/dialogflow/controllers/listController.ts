import { Response } from "express";
import { createList } from "../../actions/list/createList";
import { updateList } from "../../actions/list/updateList";
import { deleteList } from "../../actions/list/deleteList";
import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";
import { AuthRequest } from "src/types/@types";

export const handleListIntent = async (intent: string, parameters: any, originalQuery: string, res: Response, userId: string) => {
  const getOriginalListName = (query: string, listName: string): string => {
    const regex = new RegExp(`\\b${listName}\\b`, "i");
    const match = query.match(regex);
    return match ? match[0] : listName;
  };

  switch (intent) {
    case "create_list":
      const listName = parameters.listName.stringValue;
      if (!listName) {
        res.status(400).json({ response: "List name is required." });
      } else {
        const newList = await createList(listName, userId);
        res.json({
          response: `List "${listName}" created successfully.`,
          intent: "create_list",
          parameters: { listName },
          list: newList,
        });
      }
      break;

    case "update_list":
      const oldListName = parameters.oldListName?.stringValue;
      const newListName = parameters.newListName?.stringValue;
      if (!oldListName || !newListName) {
        res.status(400).json({ response: "Old list name and new list name are required." });
      } else {
        const originalOldListName = getOriginalListName(originalQuery, oldListName);
        const originalNewListName = getOriginalListName(originalQuery, newListName);
        const updatedList = await updateList(originalOldListName, originalNewListName, userId);
        res.json({
          response: `List "${originalOldListName}" updated to "${originalNewListName}" successfully.`,
          list: updatedList,
          intent: "update_list",
        });
      }
      break;

    case "delete_list":
      const listNameToDelete = parameters.listName.stringValue;
      if (!listNameToDelete) {
        res.status(400).json({ response: "List name is required." });
      } else {
        const originalListNameToDelete = getOriginalListName(originalQuery, listNameToDelete);
        const deletedList = await deleteList(originalListNameToDelete, userId);
        res.json({
          response: `List "${originalListNameToDelete}" deleted successfully.`,
          listId: deletedList._id,
          intent: "delete_list",
        });
      }
      break;

    case "read_list":
      const listNameToRead = parameters.listName.stringValue;
      if (!listNameToRead) {
        res.status(400).json({ response: "List name is required." });
      } else {
        const originalListName = getOriginalListName(originalQuery, listNameToRead);
        const list = await ExpensesListModel.findOne({
          name: originalListName,
        })
          .populate("expenses")
          .populate("creator", "name photo");
        if (!list) {
          res.status(404).json({ response: `List with name "${originalListName}" not found.` });
        } else {
          res.json({
            response: `Here is the list named "${originalListName}":`,
            list,
            intent: "read_list",
          });
        }
      }
      break;
  }
};