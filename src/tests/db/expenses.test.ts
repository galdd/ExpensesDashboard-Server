import { ExpensesModel, Expense } from "../../routes/features/expenses/expenses.model";
import { connect, disconnect } from "../../db";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose, { Types } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dbUri = process.env.TEST_DBUri as string;

beforeAll(async () => {
  await connect(dbUri);
});

afterAll(async () => {
  await disconnect();
});

// #Create: Tests for creating expenses
describe("Expense Model", () => {
  // Test case for creating a new expense
  it("should create a new expense", async () => {
    const creatorId = new Types.ObjectId();
    const expenseData: Partial<Expense> = {
      name: "Test Expense",
      price: 100,
      expenseDescription: "Test description",
      date: new Date(),
      listId: new Types.ObjectId(),
      creator: creatorId
    };
    const expense = await ExpensesModel.create(expenseData);

    expect(expense).toBeTruthy();
    expect(expense.name).toBe(expenseData.name);

    const foundExpense = await ExpensesModel.findById(expense._id);
    expect(foundExpense).toBeTruthy();
    expect(foundExpense?.name).toBe(expenseData.name);
  });
});

// #Create: Tests for handling invalid data during creation
describe("Expense Model negative tests", () => {
  // Test case for handling invalid data during creation
  it("should not create an expense with invalid data", async () => {
    const invalidExpenseData = {
      name: "",
      price: -100,
      date: "not-a-valid-date",
      expenseDescription: "Just a test",
      listId: "12345",
      creator: ""
    };

    try {
      await ExpensesModel.create(invalidExpenseData as any);
      throw new Error("Should not reach this point");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

// #CRUD: Tests for CRUD operations on expenses
describe("Expense Model CRUD Operations", () => {
  let createdExpenseId: Types.ObjectId;
  const creatorId = new Types.ObjectId();

  // #Read: Test case for reading an expense by ID
  it("should read an expense by ID", async () => {
    const expenseData: Partial<Expense> = {
      name: "Read Test Expense",
      price: 150,
      expenseDescription: "Read Test description",
      date: new Date(),
      listId: new Types.ObjectId(),
      creator: creatorId
    };
    const expense = await ExpensesModel.create(expenseData);
    createdExpenseId = expense._id;

    const foundExpense = await ExpensesModel.findById(createdExpenseId);
    expect(foundExpense).toBeTruthy();
    expect(foundExpense?.name).toBe(expenseData.name);
  });

  // #Read: Test case for handling invalid ID during reading
  it("should not find an expense with invalid ID", async () => {
    const invalidId = new Types.ObjectId();
    const foundExpense = await ExpensesModel.findById(invalidId);
    expect(foundExpense).toBeNull();
  });

  // #Update: Test case for updating an expense
  it("should update an expense", async () => {
    const updatedData: Partial<Expense> = {
      name: "Updated Expense",
      price: 200,
      expenseDescription: "Updated Test description",
      date: new Date()
    };
    const updatedExpense = await ExpensesModel.findByIdAndUpdate(
      createdExpenseId,
      { $set: updatedData },
      { new: true }
    );

    expect(updatedExpense).toBeTruthy();
    expect(updatedExpense?.name).toBe(updatedData.name);
    expect(updatedExpense?.price).toBe(updatedData.price);
    expect(updatedExpense?.expenseDescription).toBe(updatedData.expenseDescription);
    expect(updatedExpense?.date.toISOString()).toBe(updatedData.date?.toISOString());
  });

  // #Update: Test case for handling invalid data during update
  it("should not update an expense with invalid data", async () => {
    const invalidUpdateData = {
      name: "",
      price: -200
    };

    try {
      await ExpensesModel.findByIdAndUpdate(createdExpenseId, invalidUpdateData as any);
      throw new Error("Should not reach this point");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  // #Delete: Test case for deleting an expense
  it("should delete an expense", async () => {
    await ExpensesModel.findByIdAndDelete(createdExpenseId);

    const deletedExpense = await ExpensesModel.findById(createdExpenseId);
    expect(deletedExpense).toBeNull();
  });

  // #Delete: Test case for handling invalid ID during delete
  it("should not delete an expense with invalid ID", async () => {
    const invalidId = new Types.ObjectId();
    const result = await ExpensesModel.findByIdAndDelete(invalidId);
    expect(result).toBeNull();
  });
});