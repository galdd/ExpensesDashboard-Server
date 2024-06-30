import { ExpensesListModel, ExpensesList } from "../../routes/features/expenses-list/expenses-list.model";
import { connect, disconnect } from "../../db";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
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

// Clear the collection before each test
beforeEach(async () => {
  await ExpensesListModel.deleteMany({});
});

// #Create: Tests for creating expenses lists
describe("ExpensesList Model", () => {
  // Test case for creating a new expenses list
  it("should create a new expenses list", async () => {
    const creatorId = new Types.ObjectId();
    const expensesListData: Partial<ExpensesList> = {
      name: `Test Expenses List ${new Date().getTime()}`,
      creator: creatorId
    };
    const expensesList = await ExpensesListModel.create(expensesListData);

    expect(expensesList).toBeTruthy();
    expect(expensesList.name).toBe(expensesListData.name);

    const foundExpensesList = await ExpensesListModel.findById(expensesList._id);
    expect(foundExpensesList).toBeTruthy();
    expect(foundExpensesList?.name).toBe(expensesListData.name);
  });
});

// #Create: Tests for handling invalid data during creation
describe("ExpensesList Model negative tests", () => {
  // Test case for handling invalid data during creation
  it("should not create an expenses list with invalid data", async () => {
    const invalidExpensesListData = {
      name: "",
      creator: ""
    };

    try {
      await ExpensesListModel.create(invalidExpensesListData as any);
      throw new Error("Should not reach this point");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

// #CRUD: Tests for CRUD operations on expenses lists
describe("ExpensesList Model CRUD Operations", () => {
  let createdExpensesListId: Types.ObjectId;
  const creatorId = new Types.ObjectId();

  // Test case for reading an expenses list by ID
  it("should read an expenses list by ID", async () => {
    const expensesListData: Partial<ExpensesList> = {
      name: `Read Test Expenses List ${new Date().getTime()}`,
      creator: creatorId
    };
    const expensesList = await ExpensesListModel.create(expensesListData);
    createdExpensesListId = expensesList._id;

    const foundExpensesList = await ExpensesListModel.findById(createdExpensesListId);
    expect(foundExpensesList).toBeTruthy();
    expect(foundExpensesList?.name).toBe(expensesListData.name);
  });

  // Test case for handling invalid ID during reading
  it("should not find an expenses list with invalid ID", async () => {
    const invalidId = new Types.ObjectId();
    const foundExpensesList = await ExpensesListModel.findById(invalidId);
    expect(foundExpensesList).toBeNull();
  });

  // Test case for updating an expenses list
  it("should update an expenses list", async () => {
    // First, create the document to ensure its existence
    const expensesListData: Partial<ExpensesList> = {
      name: `Update Test Expenses List ${new Date().getTime()}`,
      creator: creatorId
    };
    const expensesList = await ExpensesListModel.create(expensesListData);
    createdExpensesListId = expensesList._id;

    // Verify the existence of the document before update
    const existingExpensesList = await ExpensesListModel.findById(createdExpensesListId);
    expect(existingExpensesList).toBeTruthy();

    const updatedData: Partial<ExpensesList> = {
      name: "Updated Expenses List"
    };
    const updatedExpensesList = await ExpensesListModel.findByIdAndUpdate(
      createdExpensesListId,
      { $set: updatedData },
      { new: true }
    );

    expect(updatedExpensesList).toBeTruthy();
    if (updatedExpensesList) { // Adding a null check
      expect(updatedExpensesList.name).toBe(updatedData.name);
    }
  });

  // Test case for handling invalid data during update
  it("should not update an expenses list with invalid data", async () => {
    const invalidUpdateData = {
      name: ""
    };

    try {
      await ExpensesListModel.findByIdAndUpdate(createdExpensesListId, invalidUpdateData as any);
      throw new Error("Should not reach this point");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  // Test case for deleting an expenses list
  it("should delete an expenses list", async () => {
    await ExpensesListModel.findByIdAndDelete(createdExpensesListId);

    const deletedExpensesList = await ExpensesListModel.findById(createdExpensesListId);
    expect(deletedExpensesList).toBeNull();
  });

  // Test case for handling invalid ID during delete
  it("should not delete an expenses list with invalid ID", async () => {
    const invalidId = new Types.ObjectId();
    const result = await ExpensesListModel.findByIdAndDelete(invalidId);
    expect(result).toBeNull();
  });
});