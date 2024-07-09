import mongoose, { Schema, Document, Types } from "mongoose";
import { Timestamp } from "../../../db";
import { createAndEmitNotification } from "../../../services/notification/notificationService";
import { UserModel } from "../users/users.model";

interface Creator {
  _id: mongoose.Types.ObjectId;
  name: string;
  photo: string;
}

export interface Expense extends Document, Timestamp {
  name: string;
  expenseDescription: string;
  price: number;
  date: Date;
  creator: mongoose.Types.ObjectId;
  listId: Types.ObjectId;
}

const expenseSchema = new Schema<Expense>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    expenseDescription: { type: String, required: false },
    date: { type: Date, required: false },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpensesList",
      required: true,
    }
  },
  { versionKey: false, timestamps: true }
);

expenseSchema.post('save', async function (doc) {
  const user = await UserModel.findById(doc.creator).exec();
  if (user) {
    await createAndEmitNotification({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      type: 'expense',
      action: 'add',
      listId: doc.listId,
      listName: doc.name,
      creatorName: user.name,
      avatarSrc: user.photo,
      expenseDescription: doc.name,
      price: doc.price,
    });
  }
});

expenseSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    const user = await UserModel.findById(doc.creator).exec();
    if (user) {
      await createAndEmitNotification({
        userId: (user._id as mongoose.Types.ObjectId).toString(),
        type: 'expense',
        action: 'update',
        listId: doc.listId,
        listName: doc.name,
        creatorName: user.name,
        avatarSrc: user.photo,
        expenseDescription: doc.name,
        price: doc.price,
      });
    }
  }
});

expenseSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const user = await UserModel.findById(doc.creator).exec();
    if (user) {
      await createAndEmitNotification({
        userId: (user._id as mongoose.Types.ObjectId).toString(),
        type: 'expense',
        action: 'remove',
        listId: doc.listId,
        listName: doc.name,
        creatorName: user.name,
        avatarSrc: user.photo,
        expenseDescription: doc.name,
        price: doc.price,
      });
    }
  }
});

export const ExpensesModel = mongoose.model<Expense>("Expenses", expenseSchema);