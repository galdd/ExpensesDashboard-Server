import { Express } from "express";
import "express-yields";
import expenses from "./features/expenses";
import expensesList from "./features/expenses-list";

import stats from "./features/stats";
import dialogflow from "../services/dialogflow";
import {
  errorHandler,
  catchAllRequestsLastRouteHandler,
  checkJwt,
  checkUserExists,
  extractUserInfo,
} from "./middlewares";
import users from "./features/users";
import notifications from "./features/notifications";
import { healthCheck } from "./middlewares";

export const routes = (app: Express) => {
  app.get(...healthCheck);
  app.use(checkJwt);
  app.use(extractUserInfo);
  app.use(checkUserExists);
  app.use(...users);
  app.use(...dialogflow);
  app.use(...expenses);
  app.use(...expensesList);
  app.use(...notifications);
  app.use(...stats);

  app.use(catchAllRequestsLastRouteHandler, errorHandler);
};