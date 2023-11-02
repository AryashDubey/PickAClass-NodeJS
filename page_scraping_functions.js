const puppeteer = require("puppeteer"); // Adding Puppeteer

async function scrapeASUWebsite(classData, browser) {
  try {
    const classNumber = classData.classNum;
    const classTerm = classData.term;
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.1000.0 Safari/537.36"
    );
    await page.goto(
      `https://catalog.apps.asu.edu/catalog/classes/classlist?advanced=true&campusOrOnlineSelection=A&classNbr=${classNumber}&honors=F&promod=F&searchType=all&term=${classTerm}`
    );
    //make a timeout of 5seconds for the below function
    await page.waitForSelector(`div.class-accordion`, { timeout: 5000 });
    const data = await page.evaluate(() => {
      let data = [];
      let profNames = [];
      let classSeatsArray = [];

      let elements = document.getElementsByClassName("class-accordion odd");
      let profElements = document.getElementsByClassName(
        "class-results-cell instructor"
      );
      let classSeats = document.getElementsByClassName(
        "class-results-cell seats"
      );

      for (var element of elements) {
        data.push(element.textContent);
      }
      for (var profElement of profElements) {
        profNames.push(profElement.textContent);
      }
      for (var classElement of classSeats) {
        classSeatsArray.push(classElement.textContent);
      }
      return { data, profNames, classSeatsArray };
    });
    await page.close();

    if (data.classSeatsArray.length != 0) {
      console.log(data.profNames[0]);

      var string = data.classSeatsArray[0];
      var endIndex = string.indexOf(" of");
      var prop = string.slice(0, endIndex);
      if (prop > 0) {
        // if (classNumber == 22290) {
        //   if (prop >10) {
        //     console.log("IEE 3800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000")
        //     playAudio();
        //   }
        // }
        return {
          result: true,
          profNames: data.profNames[0],
          data: data.profNames[0],
        };
      } else {
        return {
          result: false,
          profNames: data.profNames[0],
          data: data.profNames[0],
        };
      }
    } else {
      return {
        result: classData.isOpen,
        data: classData.data,
        profNames: classData.data,
      };
    }
  } catch (e) {
    console.log("ERROR PLACE 2");
    console.log(classData.classNum);
    console.log(e);
    return {
      result: classData.isOpen,
      data: classData.data,
      profNames: classData.data,
    };
  }
}

async function checkIfClassExistsFunction(classNumber, term) {
  return await puppeteer.launch().then(async function (browser) {
    try {
      const page = await browser.newPage();
      console.log(classNumber);
      await page.goto(
        `https://catalog.apps.asu.edu/catalog/classes/classlist?advanced=true&campusOrOnlineSelection=A&classNbr=${classNumber}&honors=F&promod=F&searchType=all&term=${term}`
      );
      await page.waitForSelector(`div.class-accordion`, { timeout: 1000 });
      const data = await page.evaluate(() => {
        let data = [];
        let elements = document.getElementsByClassName("class-accordion odd");
        for (var element of elements) data.push(element.textContent);
        return data;
      });
      await browser.close();
      console.log(data);
      if (data.length != 0 && data != null) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      await browser.close();
      console.log("ERROR PLACE 4");
      console.log("error");
      console.log(error);
      return false;
    }
  });
}
module.exports = { scrapeASUWebsite, checkIfClassExistsFunction };
