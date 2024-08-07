import mongoose, { Schema, Document, Types } from "mongoose";
import { Timestamp } from "../../../db";
import { Expense, ExpensesModel } from "../expenses/expenses.model";
import { createAndEmitNotification } from "../../../services/notification/notificationService";
import { UserModel } from "../users/users.model";

export interface ExpensesList extends Document, Timestamp {
  name: string;
  creator: Types.ObjectId | { name: string };
  expenses: Types.ObjectId[];
  users_ids: Types.ObjectId[];
}

const expensesListSchema = new Schema<ExpensesList>(
  {
    name: { type: String, required: true, unique: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expenses: [{ type: Schema.Types.ObjectId, ref: "Expenses" }],
    users_ids: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { versionKey: false, timestamps: true }
);

expensesListSchema.post('save', async function (doc) {
  const user = await UserModel.findById(doc.creator);
  if (user) {
    await createAndEmitNotification({
      userId: user._id as unknown as string, // Ensure it's a string
      type: 'list',
      action: 'add',
      listId: doc._id as unknown as Types.ObjectId, // Ensure it's ObjectId
      listName: doc.name,
      creatorName: user.name,
      avatarSrc: user.photo
    });
  }
});

expensesListSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    const user = await UserModel.findById(doc.creator);
    if (user) {
      await createAndEmitNotification({
        userId: user._id as unknown as string, // Ensure it's a string
        type: 'list',
        action: 'update',
        listId: doc._id as unknown as Types.ObjectId, // Ensure it's ObjectId
        listName: doc.name,
        creatorName: user.name,
        avatarSrc: user.photo
      });
    }
  }
});

expensesListSchema.post('findOneAndDelete', async function (doc) {
  console.log(doc ? doc : 'No document found');
  
  if (doc) {
    const user = await UserModel.findById(doc.creator);
    if (user) {
      await createAndEmitNotification({
        userId: user._id as unknown as string, // Ensure it's a string
        type: 'list',
        action: 'remove',
        listId: doc._id as unknown as Types.ObjectId, // Ensure it's ObjectId
        listName: doc.name,
        creatorName: user.name,
        avatarSrc: user.photo,
        expenseDescription: doc.name,
        price: 0
      });
    }
  }
});

expensesListSchema.pre('findOneAndDelete', async function (next) {
  const list = await this.model.findOne(this.getFilter());
  if (list) {
    await ExpensesModel.deleteMany({ _id: { $in: list.expenses } });
  }
  next();
});

export const ExpensesListModel = mongoose.model<ExpensesList>(
  "ExpensesList",
  expensesListSchema
);