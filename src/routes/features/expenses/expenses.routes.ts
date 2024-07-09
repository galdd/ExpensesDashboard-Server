import { Router, Request, Response } from "express";
import status from "http-status";
import { ID, returnNew } from "../../../db";
import { ExpensesModel } from "./expenses.model";
import { ExpensesListModel } from "../expenses-list/expenses-list.model";
import { AuthRequest } from "../../../types/@types";
import { baseExpensesSchemaNoId, expenseIdSchema, updateExpensesSchema } from "./expenses.routes-schema";
import { validateResource } from "../../middlewares";

export const router = Router();

router.get("/", async (_req, res) => {
  const items = await ExpensesModel.find({}).populate("creator", "name photo");
  res.status(status.OK).json(items);
});

router.post(
  "/",
  validateResource(baseExpensesSchemaNoId),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    const creator = authReq.userId;

    if (!creator) {
      return res.status(status.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const newExpense = await ExpensesModel.create({ ...authReq.body, creator });
    await newExpense.populate("creator", "name photo");

    if (authReq.body.listId) {
      await ExpensesListModel.findByIdAndUpdate(
        authReq.body.listId,
        { $push: { expenses: newExpense._id } },
        { new: true }
      );
    }

    res.status(status.CREATED).json(newExpense);
  }
);

router.get(
  "/:id",
  validateResource(expenseIdSchema),
  async (req: Request<ID>, res: Response) => {
    const item = await ExpensesModel.findById(req.params.id).populate("creator", "name photo");

    if (!item) {
      return res.sendStatus(status.NOT_FOUND);
    }

    res.status(status.OK).json(item);
  }
);

router.put(
  "/:id",
  validateResource(updateExpensesSchema),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    if (!authReq.userId) {
      return res.status(status.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    const updatedExpense = await ExpensesModel.findByIdAndUpdate(req.params.id, req.body, returnNew)
      .populate("creator", "name photo");

    if (!updatedExpense) {
      return res.sendStatus(status.NOT_FOUND);
    }

    res.status(status.OK).json(updatedExpense);
  }
);

router.delete(
  "/:id",
  validateResource(expenseIdSchema),
  async (req: Request, res: Response) => {
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

    res.status(status.OK).json(deletedExpense);
  }
);

export default ["/api/expenses", router] as [string, Router];