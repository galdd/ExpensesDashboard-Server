import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import config from "../config/config";
import { routes } from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies using query-string library

if (config.isProduction) {
  app.use(helmet());
  // app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

routes(app);

export default app;