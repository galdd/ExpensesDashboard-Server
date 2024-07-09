import { Response } from "express";
import { createExpense } from "../../actions/expense/createExpense";
import { updateExpense } from "../../actions/expense/updateExpense";
import { deleteExpense } from "../../actions/expense/deleteExpense";
import { readExpenses } from "../../actions/expense/readExpenses";
import { ExpensesListModel, ExpensesList } from "../../../routes/features/expenses-list/expenses-list.model";
import { AuthRequest } from "src/types/@types";
import { Expense } from "../../../routes/features/expenses/expenses.model";
import { Types } from "mongoose";

export const handleExpenseIntent = async (intent: string, parameters: any, originalQuery: string, res: Response, userId: string) => {
  const getOriginalName = (query: string, name: string): string => {
    const regex = new RegExp(`\\b${name}\\b`, "i");
    const match = query.match(regex);
    return match ? match[0] : name;
  };

  try {
    switch (intent) {
      case "create_expense":
        {
          const expenseName = parameters.expenseName?.stringValue;
          const expensePrice = parameters.price?.numberValue;
          const expenseListName = parameters.listName?.stringValue;
          if (!expenseName || !expensePrice || !expenseListName) {
            res.status(400).json({
              response: "Expense name, price, and list name are required.",
            });
          } else {
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
          }
        }
        break;

      case "update_expense":
        {
          const updateExpenseId = parameters.expenseId?.stringValue;
          const newExpenseName = parameters.expenseName?.stringValue;
          const newExpenseAmount = parameters.amount?.numberValue;
          if (!updateExpenseId || !newExpenseName || !newExpenseAmount) {
            res.status(400).json({ response: "Expense ID, name, and amount are required." });
          } else {
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
          }
        }
        break;

      case "delete_expense":
        {
          const deleteExpenseName = parameters.expenseName?.stringValue;
          const deleteExpenseListName = parameters.listName?.stringValue;
          if (!deleteExpenseName || !deleteExpenseListName) {
            res.status(400).json({ response: "Expense name and list name are required." });
          } else {
            const originalDeleteExpenseName = getOriginalName(originalQuery, deleteExpenseName);
            const originalDeleteExpenseListName = getOriginalName(originalQuery, deleteExpenseListName);
            console.log(
              "Original delete expense name:",
              originalDeleteExpenseName,
              "|",
              "Original delete list name:",
              originalDeleteExpenseListName
            );
           
            
            const list = await ExpensesListModel.findOne({
              name: originalDeleteExpenseListName,
            }).populate<{ expenses: Expense[] }>({
              path: "expenses",
              model: "Expenses",
            }) as ExpensesList & { _id: Types.ObjectId, expenses: Expense[] };


            if (!list) {
              throw new Error(`List "${originalDeleteExpenseListName}" not found.`);
            }

            const expense = list.expenses.find(
              (exp: any) => exp.name === originalDeleteExpenseName
            );
            if (!expense) {
              throw new Error(
                `Expense "${originalDeleteExpenseName}" not found in list "${originalDeleteExpenseListName}".`
              );
            }

            await deleteExpense(expense._id.toString(), list._id.toString());
            res.json({
              response: `Expense "${originalDeleteExpenseName}" deleted successfully from list "${originalDeleteExpenseListName}".`,
              expenseId: expense._id.toString(),
              listId: list._id.toString(),
              intent: "delete_expense",
            });
          }
        }
        break;

      case "read_expense":
        {
          const readExpenseListId = parameters.listId?.stringValue;
          if (!readExpenseListId) {
            res.status(400).json({ response: "List ID is required." });
          } else {
            const expenses = await readExpenses(readExpenseListId);
            res.json({ response: expenses, intent: "read_expense" });
          }
        }
        break;

      default:
        res.status(400).json({ response: "Unknown intent." });
    }
  } catch (error) {
    console.error(`Error handling expense intent "${intent}":`, error);
    res.status(500).json({ response: `Error handling expense intent "${intent}":`, error: (error as Error).message });
  }
};