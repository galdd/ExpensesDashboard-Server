import https from 'https';
import http from 'http';
import fs from 'fs';
import app from "./app";
import { connect } from "./db";
import { initSocket } from "./services/socket";
import config from "../config/config";

console.log(`Current Environment: ${config.isProduction ? 'Production' : 'Development'}`);

const createServer = () => {
  if (config.isProduction && config.ssl) {
    const { key, cert } = config.ssl;
    if (!fs.existsSync(key) || !fs.existsSync(cert)) {
      throw new Error("SSL key or certificate file not found.");
    }
    const sslOptions = {
      key: fs.readFileSync(key),
      cert: fs.readFileSync(cert),
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