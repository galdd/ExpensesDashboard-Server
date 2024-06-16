import { z } from "zod";

export const baseExpensesSchemaNoId = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name must be no longer than 50 characters"),
    price: z.number().positive("Price must be greater than zero"),
    expenseDescription: z.string().optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Date must be a valid date string",
      })
      .optional(),
  }),
});

export const expenseIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID must be a valid ObjectID"),
  }),
});

export const updateExpensesSchema =
  baseExpensesSchemaNoId.merge(expenseIdSchema);
