import { Router, Request, Response } from "express";
import status from "http-status";
import { ID, returnNew } from "../../../db";
import { ExpensesModel, Expense, ExpenseWithListId } from "./expenses.model";
import { ExpensesListModel } from "../expenses-list/expenses-list.model";
import { AuthRequest } from "../../../types/@types";
import { baseExpensesSchemaNoId, expenseIdSchema, updateExpensesSchema } from "./expenses.routes-schema";
import { validateResource } from "../../middlewares";
import { createAndEmitNotification } from "../../../services/notification/notificationService";

export const router = Router();

router.get("/", async (_req, res) => {
  try {
    const items = await ExpensesModel.find({}).populate("creator", "name photo");
    res.status(status.OK).json(items);
  } catch (error) {
    res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
  }
});

router.post(
  "/",
  validateResource(baseExpensesSchemaNoId),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { listId, ...expenseData } = authReq.body;
      const creator = authReq.userId;

      if (!creator) {
        return res.status(status.UNAUTHORIZED).json({ message: "User not authenticated" });
      }

      const newExpense = await ExpensesModel.create({ ...expenseData, creator });
      await newExpense.populate("creator", "name photo");

      if (listId) {
        const list = await ExpensesListModel.findByIdAndUpdate(
          listId,
          { $push: { expenses: newExpense._id } },
          { new: true }
        );

        if (list) {
          await createAndEmitNotification({
            userId: creator,
            type: "expense",
            action: "add",
            listId: list._id,
            listName: list.name,
            creatorName: newExpense.creator.name,
            avatarSrc: newExpense.creator.photo,
            expenseDescription: newExpense.name,
            price: newExpense.price,
          });
        }
      }

      res.status(status.CREATED).json(newExpense);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

router.get(
  "/:id",
  validateResource(expenseIdSchema),
  async (req: Request<ID>, res: Response) => {
    try {
      const item = await ExpensesModel.findById(req.params.id).populate("creator", "name photo");

      if (!item) {
        return res.sendStatus(status.NOT_FOUND);
      }

      res.status(status.OK).json(item);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

router.put(
  "/:id",
  validateResource(updateExpensesSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;

      if (!authReq.userId) {
        return res.status(status.UNAUTHORIZED).json({ message: "User not authenticated" });
      }

      const updatedExpense = await ExpensesModel.findByIdAndUpdate(req.params.id, req.body, returnNew)
        .populate("creator", "name photo");

      if (!updatedExpense) {
        return res.sendStatus(status.NOT_FOUND);
      }

      const list = await ExpensesListModel.findById(req.body.listId);

      await createAndEmitNotification({
        userId: authReq.userId,
        type: "expense",
        action: "update",
        listId: list ? list._id : req.body.listId,
        listName: list ? list.name : req.body.listId,
        creatorName: updatedExpense.creator.name,
        avatarSrc: updatedExpense.creator.photo,
        expenseDescription: updatedExpense.name,
        price: updatedExpense.price,
      });

      res.status(status.OK).json(updatedExpense);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

router.delete(
  "/:id",
  validateResource(expenseIdSchema),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { listId } = authReq.query;

      if (!authReq.userId) {
        return res.status(status.UNAUTHORIZED).json({ message: "User not authenticated" });
      }

      const deletedExpense = await ExpensesModel.findByIdAndDelete(req.params.id).populate("creator", "name photo");

      if (!deletedExpense) {
        return res.sendStatus(status.NOT_FOUND);
      }

      if (listId) {
        await ExpensesListModel.findByIdAndUpdate(listId as string, { $pull: { expenses: req.params.id } }, { new: true });
      }

      const list = await ExpensesListModel.findById(listId as string);

      await createAndEmitNotification({
        userId: authReq.userId,
        type: "expense",
        action: "remove",
        listId: list ? list._id : (listId as string),
        listName: list ? list.name : (listId as string),
        creatorName: deletedExpense.creator.name,
        avatarSrc: deletedExpense.creator.photo,
        expenseDescription: deletedExpense.name,
        price: deletedExpense.price,
      });

      res.status(status.OK).json(deletedExpense);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

export default ["/api/expenses", router] as [string, Router];