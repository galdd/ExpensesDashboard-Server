import https from 'https';
import http from 'http';
import fs from 'fs';
import app from "./app";
import { connect } from "./db";
import { initSocket } from "./services/socket";
import config from "../config/config";

const createServer = () => {
  if (config.isProduction && config.ssl) {
    const sslOptions = {
      key: fs.readFileSync(config.ssl.key),
      cert: fs.readFileSync(config.ssl.cert),
    };
    return https.createServer(sslOptions, app);
  }
  return http.createServer(app);
};

const server = createServer();

server.listen(config.port, async () => {
  console.log(`Server is running on port: ${config.port}`);
  await connect(config.dbUri);
  await initSocket(server); // Initialize Socket.IO
});