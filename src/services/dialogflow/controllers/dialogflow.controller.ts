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
import { ExpensesModel } from "../../../routes/features/expenses/expenses.model";
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

     console.log("result:", result);
     console.log("parameters:", parameters);

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
          const oldListName = parameters.oldListName?.stringValue;
          const newListName = parameters.newListName?.stringValue;
          if (!oldListName || !newListName) {
            res.status(400).json({ response: "Old list name and new list name are required." });
          } else {
            try {
              const originalOldListName = getOriginalName(originalQuery, oldListName);
              const originalNewListName = getOriginalName(originalQuery, newListName);
              const updatedList = await updateList(originalOldListName, originalNewListName);
              res.json({
                response: `List "${originalOldListName}" updated to "${originalNewListName}" successfully.`,
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
        const listNameToDelete = parameters.listName.stringValue;
        if (!listNameToDelete) {
          res.status(400).json({ response: "List name is required." });
        } else {
          try {
            const originalListNameToDelete = getOriginalListName(originalQuery, listNameToDelete);
            const deletedList = await deleteList(originalListNameToDelete);
            res.json({
              response: `List "${originalListNameToDelete}" deleted successfully.`,
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
        const listNameToRead = parameters.listName.stringValue;
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
              .populate("creator", "name photo");
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
            res.status(400).json({
              response: "Expense name, price, and list name are required.",
            });
          } else {
            try {
              const originalExpenseListName = getOriginalName(originalQuery, expenseListName);
              const originalExpenseName = getOriginalName(originalQuery, expenseName);
              const { newExpense, listId } = await createExpense(
                originalExpenseName,
                expensePrice,
                originalExpenseListName,
                userId
              );
              res.json({
                response: `Expense "${originalExpenseName}" created successfully.`,
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
              res.status(400).json({ response: "Expense ID, name, and amount are required." });
            } else {
              try {
                const originalNewExpenseName = getOriginalName(originalQuery, newExpenseName);
                const updatedExpense = await updateExpense(
                  updateExpenseId,
                  originalNewExpenseName,
                  newExpenseAmount
                );
                res.json({
                  response: `Expense updated to "${originalNewExpenseName}" successfully.`,
                  expense: updatedExpense,
                  intent: "update_expense",
                });
              } catch (error) {
                console.error("Error updating expense:", error.message);
                handleErrorResponse(res, error.message);
              }
            }
            break;

            case "delete_expense":
              const deleteExpenseName = parameters.expenseName.stringValue;
              const deleteExpenseListName = parameters.listName.stringValue;
              if (!deleteExpenseName || !deleteExpenseListName) {
                res.status(400).json({ response: "Expense name and list name are required." });
              } else {
                try {
                  const originalDeleteExpenseName = getOriginalName(originalQuery, deleteExpenseName);
                  const originalDeleteExpenseListName = getOriginalName(originalQuery, deleteExpenseListName);
                  console.log("Original delete expense name:", originalDeleteExpenseName, "|", "Original delete list name:", originalDeleteExpenseListName);
            
                  const list = await ExpensesListModel.findOne({ name: originalDeleteExpenseListName }).populate("expenses");
                  if (!list) {
                    throw new Error(`List "${originalDeleteExpenseListName}" not found.`);
                  }
                  
                  const expense = list.expenses.find(exp => exp.name === originalDeleteExpenseName);
                  if (!expense) {
                    throw new Error(`Expense "${originalDeleteExpenseName}" not found in list "${originalDeleteExpenseListName}".`);
                  }
            
                  await deleteExpense(expense._id, list._id);
                  res.json({
                    response: `Expense "${originalDeleteExpenseName}" deleted successfully from list "${originalDeleteExpenseListName}".`,
                    expenseId: expense._id,
                    listId: list._id,
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

const getOriginalName = (query: string, name: string): string => {
  const regex = new RegExp(`\\b${name}\\b`, "i");
  const match = query.match(regex);
  return match ? match[0] : name;
};