const emailFunctions = require("./email_const");
const emailDelayedFunctions = require("./email_const_delayed");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const { generateClassChangesEmail } = require("./class_change_email");
let transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: "mail@pickaclass.app",
    pass: "hinbnafwmxqbpdlj",
  },
});

async function sendOpenMail(mail_list, profName, classNum) {
  // getting dest email by query string

  if (mail_list.paidSubscriberList.length !== 0) {
    const mailOptions = {
      from: "Pick A Class pickaclass@gmail.com", // Something like: Jane Doe <janedoe@gmail.com>
      bcc: mail_list.paidSubscriberList,
      subject: `Prof. ${profName}'s class, ${classNum}, is now Open!`, // email subject
      html: emailFunctions.generateOpenEmail(classNum, profName), // email content in HTML
    };
    await transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
        return error.toString();
      }
      return "Sent";
    });
  }
  if (mail_list.freeSubscriberList.length !== 0) {
    const startTime = new Date(Date.now() + 1000 * 60 * 15);
    schedule.scheduleJob(startTime, async function () {
      const mailOptions = {
        from: "Pick A Class pickaclass@gmail.com", // Something like: Jane Doe <janedoe@gmail.com>
        bcc: mail_list.freeSubscriberList,
        subject: `Prof. ${profName}'s class, ${classNum}, is now Open!`, // email subject
        html: emailDelayedFunctions.generateDelayedOpenEmail(
          classNum,
          profName
        ), // email content in HTML
      };
      await transporter.sendMail(mailOptions, (error) => {
        if (error) {
          console.log(error);
          return error.toString();
        }
        return "Sent";
      });
    });
  }
}
async function sendClassChangedEmail(mail_list, profName, classNum) {
  // getting dest email by query string
  if (profName === undefined) {
    return;
  }
  if (mail_list.length !== 0) {
    const mailOptions = {
      from: "Pick A Class pickaclass@gmail.com", // Something like: Jane Doe <janedoe@gmail.com>
      bcc: mail_list,
      subject: `Changes in ${classNum}. Assigned to ${profName}`, // email subject
      html: generateClassChangesEmail(classNum, profName), // email content in HTML
    };
    await transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
        return error.toString();
      }
      return "Sent";
    });
  }
}

async function sendCloseMail(mail_list, profName, classNum) {
  // getting dest email by query string

  const mailOptions = {
    from: "Pick A Class pickaclass@gmail.com", // Something like: Jane Doe <janedoe@gmail.com>
    bcc: mail_list.paidSubscriberList,

    subject: `Prof. ${profName}'s class,${classNum}, is now Closed.`, // email subject
    html: emailFunctions.generateCloseEmail(classNum, profName), // email content in HTML
  };

  // returning result
  await transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
      return error.toString();
    }
    return "Sent";
  });
}
module.exports = { sendCloseMail, sendOpenMail, sendClassChangedEmail };
