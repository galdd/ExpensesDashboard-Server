import { Request, Response } from "express";
import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuidv4 } from "uuid";
import { handleListIntent } from "./listController";
import { handleExpenseIntent } from "./expenseController";
import { AuthRequest } from "src/types/@types";

const projectId = process.env.GOOGLE_PROJECT_ID!;
const sessionId = uuidv4();
const sessionClient = new dialogflow.SessionsClient();

const handleErrorResponse = (res: Response, errorMessage: string) => {
  let response = errorMessage.toString().replace(/"/g, "");
  // console.log("Error response:", response);

  res.status(400).json({ response });
};

const intentHandlers: { [key: string]: Function } = {
  list: handleListIntent,
  expense: handleExpenseIntent,
};

export const handleDialogFlowRequest = async (req: Request, res: Response) => {
  const { message } = req.body;
  const { userId } = req as AuthRequest;
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: "en-US",
      },
    },
    queryParams: {
      payload: {
        fields: {
          originalQuery: {
            stringValue: message,
            kind: "stringValue",
          },
        },
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    if (!result) {
      console.log("No intent matched.");
      res.status(400).json({ response: "No intent matched." });
      return;
    }

    const intent = result.intent?.displayName;
    const parameters = result.parameters?.fields;
    const originalQuery = result.queryText;

    // console.log("result:", result);
    // console.log("parameters:", parameters);

    if (!intent || !parameters) {
      res.status(400).json({ response: "Invalid intent or parameters." });
      return;
    }

    const intentType = intent.split('_').pop(); // Get the type of intent, e.g., 'list' or 'expense'

    if (intentType && intentHandlers[intentType]) {
      await intentHandlers[intentType](intent, parameters, originalQuery, res, userId);
    } else {
      res.status(400).json({ response: "Unknown intent." });
    }
  } catch (error) {
    console.error("Error in Dialogflow request:", error);
    res.status(500).json({ response: `Error in Dialogflow request.`, error: (error as Error).message });
  }
};

export default handleDialogFlowRequest;