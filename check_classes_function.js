const scrapFunc = require("./page_scraping_functions");
const admin = require("firebase-admin");
var serviceAccount = require("./admin.json");
const { execSync } = require("child_process");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pick-a-class.firebaseio.com",
  authDomain: "pick-a-class.firebaseapp.com",
});
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const puppeteer = require("puppeteer"); // Adding Puppeteer
const {
  sendCloseMail,
  sendOpenMail,
  sendClassChangedEmail,
} = require("./mail_functions");
const Parallelism = 4;
const asyncBatch = require("async-batch").default;
const jsfile = require("../../../Learning/Server/index");

var classDataForAsyncMethod = [];

async function scheduledMaintenanceFunction() {
  var snapshot = await db.collection("universities").get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return;
  }

  var docs = [];
  snapshot.forEach((doc) => docs.push(doc.data().classes));

  await asyncBatch(
    docs[0],
    async (e) => {
      var list = await db
        .collection("users")
        .where("classIDs", "array-contains", `${e.classID}`)
        .get();

      if (list.empty) {
        await db
          .collection("universities")
          .doc("asu")
          .update({
            classes: admin.firestore.FieldValue.arrayRemove(e),
          });
      }
    },
    Parallelism
  );
}
let numberOfTimesFunctionCalled = 0;
//
async function checkForClassesFunction() {
  await puppeteer
    .launch({
      headless: true,
    })
    .then(async (browser) => {
      try {
        var snapshot = await db.collection("universities").get();
        if (snapshot.empty) {
          console.log("No matching documents.");
          return;
        }

        var docs = [];
        snapshot.forEach((doc) => docs.push(doc.data().classes));

        classDataForAsyncMethod = [];
        await asyncBatch(
          docs[0],
          async (val) => {
            var data = await checkForIndividualClass(val, browser);
            classDataForAsyncMethod.push(data);
          },
          Parallelism
        );
        classDataForAsyncMethod.sort((a, b) => a.classNum - b.classNum);
        if (
          JSON.stringify(docs[0]) != JSON.stringify(classDataForAsyncMethod)
        ) {
          await db.collection("universities").doc("asu").update({
            classes: classDataForAsyncMethod,
          });
        }
        await browser.close();
      } catch (error) {
        console.log("Error Place 1");
        console.log(error);
        await browser.close();
      }
    });
  numberOfTimesFunctionCalled++;
  console.log(`Function called ${numberOfTimesFunctionCalled} times`);
  await checkForClassesFunction();
}

async function playAudio() {
  try {
    execSync(`powershell -c (New-Object Media.SoundPlayer "j.wav").PlaySync()`);
  } catch (e) {
    console.log(e);
  }
}

async function checkForIndividualClass(classData, browser) {
  var classNum = classData.classNum;

  var result = await scrapFunc.scrapeASUWebsite(classData, browser);

  var newClassDoc = {};

  // TODO CHECK THE LOGIC !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  if (classData.data !== result.data && result.data) {
    if (classData.data !== undefined) {
      console.log("Class Changed");
      const list = await getClassChangesSubscriberList(classData.classID);
      await sendClassChangedEmail(list, result.profNames, classNum);
    }
  }

  if (result.result) {
    //BIO 130
    if (classNum == 15176) {
      // await jsfile.fn("20783", "15176");
      playAudio();
    }
    //KEVIN BURGER CSE 230
    if (classNum == 34811) {
      await jsfile.fn("13964", "34811");
      playAudio();
    }
    if (classNum == 34812) {
      await jsfile.fn("13964", "34812");
      playAudio();
    }

    //MAT 343
    if (classNum == 25690) {
      await jsfile.fn("14480", "25690");
      playAudio();
    }
    if (classNum == 25613) {
      await jsfile.fn("14480", "25613");
      playAudio();
    }

    if (classNum == 19214) {
      await jsfile.fn("14480", "19214");
      playAudio();
    }

    // if (classNum == 26224) {
    //   await jsfile.fn("17217", "26224");
    //   playAudio();
    // }
    if (classData.isOpen != result.result) {
      var mail_list = await getClassSubscriberList(classData.classID);

      console.log(`NEW OPEN ${classNum} `);

      if (
        mail_list.paidSubscriberList.length != 0 ||
        mail_list.freeSubscriberList.length != 0
      ) {
        console.log("Sending Mail");

        await sendOpenMail(mail_list, result.profNames, classNum);
      }
    } else {
      console.log(`STILL OPEN ${classNum} `);
    }
  } else {
    if (classData.isOpen != result.result) {
      var newMailList = await getClassSubscriberList(classData.classID);
      console.log("Sending CLOSE Mail");
      await sendCloseMail(newMailList, result.profNames, classNum);
    } else {
      console.log("Still Close");
    }
  }
  newClassDoc = {
    ...classData,
    isOpen: result.result,
    data: result.data,
  };
  return newClassDoc;
}
async function getClassSubscriberList(classID) {
  var paidSubscriberList = [];
  var freeSubscriberList = [];
  console.log(classID);
  var classData = await db
    .collection("users")
    .where("classIDs", "array-contains", `${classID}`)
    .get();
  if (classData.empty) {
    console.log("No matching documents.");
    return {
      freeSubscriberList,
      paidSubscriberList,
    };
  }

  classData.forEach((doc) => {
    console.log(doc.data().userCreatedAt);
    if (doc.data().paidSubscriber) {
      paidSubscriberList.push(doc.data().email);
    } else {
      freeSubscriberList.push(doc.data().email);
    }
  });
  console.log(paidSubscriberList);
  console.log(freeSubscriberList);

  return {
    freeSubscriberList,
    paidSubscriberList,
  };
}
async function getClassChangesSubscriberList(classID) {
  var subscriberList = [];

  console.log(classID);
  var userData = await db
    .collection("users")
    .where("classIDs", "array-contains", `${classID}`)
    .get();
  if (userData.empty) {
    console.log("No matching documents.");
    return subscriberList;
  }

  userData.forEach((doc) => {
    if (doc.data().paidSubscriber && doc.data().subscribedToChanges) {
      subscriberList.push(doc.data().email);
    }
  });
  console.log(subscriberList);

  return subscriberList;
}
module.exports = {
  checkForClassesFunction,
  db,
  scheduledMaintenanceFunction,
  anotherTestFunction,
  getBackClassDataFromUsers,
  playAudio,
};

//FUNCTION TO RESET USER DATA

async function getBackClassDataFromUsers() {
  var list = [];
  await db
    .collection("users")
    .get()
    .then((data) => {
      data.forEach((doc) => {
        //console.log(doc.data());
        var cl = doc.data().classIDs;
        if (cl !== undefined) {
          cl.forEach((e) => {
            list.push({
              classID: e,
              classNum: parseInt(e.substring(4, 9)),
              isOpen: false,
              term: Number(e.substring(10)), //change to number,
            });
          });
        }
      });
    });
  var uniq = [];
  list.forEach((e) => {
    if (!uniq.includes(e)) {
      uniq.push(e);
    }
  });
  const unique = [...new Map(list.map((doc) => [doc.classID, doc])).values()];

  console.log(unique);
  await db.collection("universities").doc("asu").update({ classes: unique });
}

//
async function anotherTestFunction() {
  var list = [];
  var ref = await db.collection("users");
  ref.get().then((data) => {
    data.forEach((data) => {
      list = [];
      console.log(data.data());

      var cl = data.data().classIDs;
      if (cl !== undefined) {
        cl.forEach((e) => {
          list.push(`${e}`);
        });
      }
      console.log(list);

      data.ref.update({ classIDs: list });
    });
  });

  //await db.collection("universities").doc("asu").update({ classes: unique });
}

// async function anotherTestFunction() {
//   var list = [];
//   var ref = await db.collection("universities").doc("asu");
//   ref.get().then((data) => {
//     console.log(data.data());

//     var cl = data.data().classes;
//     if (cl !== undefined) {
//       cl.forEach((e) => {
//         list.push({ ...e, classID: `${e.classID}-${e.term}` });
//       });
//     }
//     console.log(list);
//      ref.update({ classes: list });
//   });
// }
