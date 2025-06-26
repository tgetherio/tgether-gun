const Gun = require('gun');
const http = require('http');

const server = http.createServer((req, res) => {
  res.end("Gun relay running");
});

Gun({ web: server }); // in-memory only, no persistence
server.listen(8765, () => {
  console.log("Gun relay running a55/gun");
});
