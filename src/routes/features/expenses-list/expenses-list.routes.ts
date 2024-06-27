import { Router, Request, Response } from "express";
import status from "http-status";
import { Expense, ExpensesModel } from "../expenses/expenses.model";
import { UserModel } from "../users/users.model";
import {
  baseExpensesListSchemaNoId,
  paginationSchema,
  queryParamsValidator,
} from "./expenses-list.routes-schema";
import { ExpensesListModel } from "./expenses-list.model";
import { AuthRequest } from "../../../types/@types";
import { validateResource } from "../../middlewares/validate-resource";

const router = Router();

const getTotalExpenses = (expenses: Expense[]) =>
  expenses.reduce((total, { price }) => total + price, 0);

const sendResponseWithTotal = async (req: Request, res: Response, lists: any[]) => {
  const listsWithTotal = lists.map((list) => ({
    ...list.toObject(),
    totalExpenses: getTotalExpenses(list.expenses),
  }));

  const totalLists = await ExpensesListModel.countDocuments();

  res.status(status.OK).json({
    offset: parseInt(req.query.offset as string),
    limit: parseInt(req.query.limit as string),
    sortOrder: req.query.sortOrder,
    total: totalLists,
    data: listsWithTotal,
  });
};

router.get(
  "/",
  validateResource(paginationSchema),
  async (req: Request, res: Response) => {
    try {
      const { offset, limit, sortOrder } = req.query;
      const lists = await ExpensesListModel.find({})
        .populate("creator")
        .populate({
          path: "expenses",
          populate: {
            path: "creator",
            select: "name photo",
          },
        })
        .sort({ createdAt: sortOrder === "asc" ? 1 : -1 })
        .skip(parseInt(offset as string))
        .limit(parseInt(limit as string));

      await sendResponseWithTotal(req, res, lists);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

router.post(
  "/",
  validateResource(baseExpensesListSchemaNoId),
  async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      const { userId } = req as AuthRequest;

      if (!name || !userId) {
        return res.status(status.BAD_REQUEST).json({ message: "Name and creator are required." });
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(status.NOT_FOUND).json({ message: "User not found." });
      }

      const newList = new ExpensesListModel({ name, creator: user._id, expenses: [], users_ids: [] });
      const savedList = await newList.save();

      res.status(status.CREATED).json(savedList);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

router.put(
  "/:id",
  validateResource(baseExpensesListSchemaNoId),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const { userId } = req as AuthRequest;

      if (!name || !userId) {
        return res.status(status.BAD_REQUEST).json({ message: "Name and creator are required." });
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(status.NOT_FOUND).json({ message: "User not found." });
      }

      const updatedList = await ExpensesListModel.findByIdAndUpdate(
        id,
        { name, creator: user._id },
        { new: true, runValidators: true }
      );

      if (!updatedList) {
        return res.status(status.NOT_FOUND).json({ message: "List not found" });
      }

      res.status(status.OK).json(updatedList);
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

router.delete(
  "/:id",
  validateResource(queryParamsValidator),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId } = req as AuthRequest;

      const deletedList = await ExpensesListModel.findByIdAndDelete(id);

      if (!deletedList) {
        return res.status(status.NOT_FOUND).json({ message: "List not found" });
      }

      res.status(status.OK).json({ message: "List and related expenses deleted successfully" });
    } catch (error) {
      res.status(status.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }
);

export default ["/api/expenses-list", router] as [string, Router];