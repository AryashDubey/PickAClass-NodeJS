const { execSync } = require("child_process");
const http = require("http");
const { checkForClassesFunction, getBackClassDataFromUsers } = require("./check_classes_function");
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

 server.on("request", async (req, res) => {
  cors(req, res, async () => {
    if (req.method === "POST") {
      await getBackClassDataFromUsers();
      res.end("POST request sent");
    } 
  })
  });
  let isFunctionRunning = false;

server.listen(port, host, () => { 
  console.log(`Server is running on http://${host}:${port}`);
   checkForClassesFunction();
  // setInterval(async () =>  checkForClassesTimed(), 120000);
});

async function checkForClassesTimed()  {
  if (isFunctionRunning) {
    console.log("Previous function call is still running. Skipping this interval.");
    return;
  }

  isFunctionRunning = true;
  console.log("Function is running...");
  await checkForClassesFunction();
  isFunctionRunning = false;
  console.log("Function completed.");

  // Simulate some asynchronous task (e.g., API call, file operation, etc.)
  setTimeout(() => {
    isFunctionRunning = false;
    console.log("Function completed.");
  }, 600000); // Replace 5000 with the time taken for your actual function to complete.

}



// exports.test = functions.https.onRequest(async (req, res) => {
//   anotherTestFunction();
// });
// setInterval(async () => await checkForClasses(), 30000)
