const http = require("http");
const { checkForClassesFunction } = require("./check_classes_function");
const host = "localhost";
const port = 8000;
const Parallelism = 5;

const asyncBatch = require("async-batch").default;
const cors = require("cors")({ origin: true });

// exports.scheduledFunction = functions
//   .runWith({ memory: "2GB" })
//   .pubsub.schedule("* * * * *")
//   .onRun(async () => {
//     console.log("RUNNING");
//     await checkForClassesFunction();
//     return null;
//   });
//  checkForClassesFunction();
const requestListener = function (req, res) {
  res.writeHead(200);
  res.end("My first server!");
};
const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  setInterval(async () => await checkForClassesFunction(), 30000);
});

// exports.test = functions.https.onRequest(async (req, res) => {
//   anotherTestFunction();
// });
// setInterval(async () => await checkForClasses(), 30000)
