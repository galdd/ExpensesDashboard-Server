import { Request, Response } from "express";
import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuidv4 } from "uuid";
import { createList } from "../intents/list/createList";
import { updateList } from "../intents/list/updateList";
import { deleteList } from "../intents/list/deleteList";
import { readLists } from "../intents/list/readLists";
import { createExpense } from "../intents/expense/createExpense";
import { updateExpense } from "../intents/expense/updateExpense";
import { deleteExpense } from "../intents/expense/deleteExpense";
import { readExpenses } from "../intents/expense/readExpenses";
import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";
import { AuthRequest } from "src/types/@types";

const projectId = process.env.GOOGLE_PROJECT_ID!;
const sessionId = uuidv4();
const sessionClient = new dialogflow.SessionsClient();

const handleErrorResponse = (res: Response, errorMessage: string) => {
  let response = errorMessage.toString().replace(/"/g, "");
  console.log("Error response:", response);

  res.status(400).json({ response });
};

export const handleDialogFlowRequest = async (req: Request, res: Response) => {
  const { message } = req.body;
  const { userId } = req as AuthRequest;
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: "en-US",
      },
    },
    queryParams: {
      payload: {
        fields: {
          originalQuery: {
            stringValue: message,
            kind: "stringValue",
          },
        },
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    if (!result) {
      console.log("No intent matched.");
      res.status(400).json({ response: "No intent matched." });
      return;
    }

    const intent = result.intent.displayName;
    const parameters = result.parameters.fields;
    const originalQuery = result.queryText;

    const getOriginalListName = (query: string, listName: string): string => {
      const regex = new RegExp(`\\b${listName}\\b`, "i");
      const match = query.match(regex);
      return match ? match[0] : listName;
    };

    switch (intent) {
      case "create_list":
        const listName = parameters.listName.stringValue.toLowerCase();
        if (!listName) {
          res.status(400).json({ response: "List name is required." });
        } else {
          try {
            const newList = await createList(listName, userId);
            res.json({
              response: `List "${listName}" created successfully.`,
              intent: "create_list",
              parameters: { listName },
              list: newList,
            });
          } catch (error) {
            console.error("Error creating list:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      case "update_list":
        const oldListName = parameters.oldListName.stringValue.toLowerCase();
        const newListName = parameters.newListName.stringValue.toLowerCase();
        if (!oldListName || !newListName) {
          res
            .status(400)
            .json({
              response: "Old list name and new list name are required.",
            });
        } else {
          try {
            const updatedList = await updateList(oldListName, newListName);
            res.json({
              response: `List "${oldListName}" updated to "${newListName}" successfully.`,
              list: updatedList,
              intent: "update_list",
            });
          } catch (error) {
            console.error("Error updating list:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      case "delete_list":
        const deleteListName = parameters.listName.stringValue.toLowerCase();
        if (!deleteListName) {
          res.status(400).json({ response: "List name is required." });
        } else {
          try {
            const deletedList = await deleteList(deleteListName);
            res.json({
              response: `List "${deleteListName}" deleted successfully.`,
              listId: deletedList._id,
              intent: "delete_list",
            });
          } catch (error) {
            console.error("Error deleting list:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      case "read_list":
        const listNameToRead = parameters.listName.stringValue.toLowerCase();
        if (!listNameToRead) {
          res.status(400).json({ response: "List name is required." });
        } else {
          try {
            const originalListName = getOriginalListName(
              originalQuery,
              listNameToRead
            );
            const list = await ExpensesListModel.findOne({
              name: originalListName,
            })
              .populate("expenses")
              .populate("creator", "name");
            if (!list) {
              res
                .status(404)
                .json({
                  response: `List with name "${originalListName}" not found.`,
                });
            } else {
              res.json({
                response: `Here is the list named "${originalListName}":`,
                list,
                intent: "read_list",
              });
            }
          } catch (error) {
            console.error("Error reading list:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      case "create_expense":
        console.log("Create expense parameters:", parameters);

        const expenseName = parameters.expenseName?.stringValue;
        const expensePrice = parameters.price?.numberValue;
        const expenseListName = parameters.listName?.stringValue;
        if (!expenseName || !expensePrice || !expenseListName) {
          res
            .status(400)
            .json({
              response: "Expense name, price, and list name are required.",
            });
        } else {
          try {
            const originalExpenseListName = getOriginalListName(
              originalQuery,
              expenseListName
            );
            const { newExpense, listId } = await createExpense(
              expenseName,
              expensePrice,
              originalExpenseListName,
              userId
            );
            res.json({
              response: `Expense "${expenseName}" created successfully.`,
              expense: newExpense,
              listId,
              intent: "create_expense",
            });
          } catch (error) {
            console.error("Error creating expense:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      case "update_expense":
        const updateExpenseId = parameters.expenseId.stringValue;
        const newExpenseName = parameters.expenseName.stringValue;
        const newExpenseAmount = parameters.amount.numberValue;
        if (!updateExpenseId || !newExpenseName || !newExpenseAmount) {
          res
            .status(400)
            .json({ response: "Expense ID, name, and amount are required." });
        } else {
          try {
            const updatedExpense = await updateExpense(
              updateExpenseId,
              newExpenseName,
              newExpenseAmount
            );
            res.json({
              response: `Expense updated to "${newExpenseName}" successfully.`,
              expense: updatedExpense,
            });
          } catch (error) {
            console.error("Error updating expense:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      case "delete_expense":
        const deleteExpenseId = parameters.expenseId.stringValue;
        if (!deleteExpenseId) {
          res.status(400).json({ response: "Expense ID is required." });
        } else {
          try {
            await deleteExpense(deleteExpenseId);
            res.json({
              response: `Expense deleted successfully.`,
              intent: "delete_expense",
            });
          } catch (error) {
            console.error("Error deleting expense:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      case "read_expense":
        const readExpenseListId = parameters.listId.stringValue;
        if (!readExpenseListId) {
          res.status(400).json({ response: "List ID is required." });
        } else {
          try {
            const expenses = await readExpenses(readExpenseListId);
            res.json({ response: expenses, intent: "read_expense" });
          } catch (error) {
            console.error("Error reading expenses:", error.message);
            handleErrorResponse(res, error.message);
          }
        }
        break;

      default:
        res.status(400).json({ response: "Unknown intent." });
    }
  } catch (error) {
    console.error("Error in Dialogflow request:", error);
    res
      .status(500)
      .json({ response: `Error in Dialogflow request.`, error: error.message });
  }
};

export default handleDialogFlowRequest;
