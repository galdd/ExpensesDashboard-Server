import { ExpensesListModel } from "../../../routes/features/expenses-list/expenses-list.model";

export const readLists = async (query: any) => {
  const { offset, limit, sortOrder } = query;
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

  return lists;
};