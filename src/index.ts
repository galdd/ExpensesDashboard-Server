import http from 'http';
import app from "./app";
import { connect } from "./db";
import { initSocket } from "./services/socket";

const port = process.env.PORT || 1337;
const server = http.createServer(app);

server.listen(port, async () => {
  console.log("Server is running on port:", port);
  await connect(process.env.DBUri as string);
  await initSocket(server); // Initialize Socket.IO
});