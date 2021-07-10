const firebase = require("firebase")
const nodemailer = require("nodemailer");

const firebaseConfig = {
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTHDOMAIN,
  databaseURL: process.env.DATABASEURL,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  messagingSenderId: process.env.MESSAGINGSENDERID,
  appId: process.env.APPID,
  measurementId: process.env.MEASUREMENTID
};

firebase.initializeApp(firebaseConfig)

var currentYear = new Date().getFullYear()
var currentMonth = new Date().getMonth();
currentMonth = currentMonth + 1
let date = new Date().getDate()
let today = currentMonth + "-" + date + "-" + currentYear


exports.handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });

    console.log('API called for Marking late at: ', today)

    firebase.database().ref("/Attendance").once("value", (res) => {
      let userUids = [];
      const attendanceObj = res.val()
      firebase.database().ref("/Users").once("value", (res) => {
        const users = res.val()
        Object.values(users).map((item, index) => {
          if (item.isVerified && item.role === "Authorized") {
            return userUids.push(item.uid) // filtered verified and excluded admin and unverified users data
          }
        })
        userUids && userUids.map((uid, index) => {
          if (!attendanceObj || (!attendanceObj[uid] || !attendanceObj[uid][currentYear] || !attendanceObj[uid][currentYear][currentMonth] || !attendanceObj[uid][currentYear][currentMonth][today] || !attendanceObj[uid][currentYear][currentMonth][today] === "isLate")) {
            console.log(`${users[uid].email} is late while total staff strength is ${userUids.length}`)
            transporter.sendMail({
              from: process.env.USER, // sender address
              to: users[uid].email, // list of receivers
              subject: `Late Alert - ${users[uid].firstName} ${' '} ${users[uid].lastName} - Attendance Management System - Computing Yard `, // Subject line
              // text: `Late Alert of ${users[uid].firstName} + " " + ${users[uid].lastName}`, // plain text body
              html: `Dear <b>${users[uid].firstName} ${' '} ${users[uid].lastName}</b> , You are late for ${today}<br/><br/><br/><br/><br/><br/>

              <br/>
              REGARDS, <br/>
              COMPUTING YARD <br/>
              ATTENDANCE MANAGEMENT SYSTEM <br/>
              `, // html body
            });
            firebase.database().ref(`/Attendance/${uid}/${currentYear}/${currentMonth}/${today}`).update({
              isLate: true
            })
          }
        })
      })
    })
};