import http from "http";
import { startGunRelay, getGunInstance } from "./gunRelay";
import { createApi } from "./api";
import { PORT } from "./config";

// 1. Create HTTP server manually
const server = http.createServer();

// 2. Start Gun on the server (MUST happen before API tries to use Gun)
startGunRelay(server);

// 3. Inject Gun into API after it's initialized
const app = createApi(getGunInstance()); // <- pass gun explicitly
server.on("request", app); // Attach Express to the server

server.listen(PORT, () => {
  console.log(`🚀 Tgether Gun server live at http://localhost:${PORT}/gun`);
});
