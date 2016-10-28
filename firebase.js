var firebase = require("firebase");

var config = {
  apiKey: "AIzaSyDH8qA0uF6b8AfNeaB7oz_T57_y7PXurqo",
  authDomain: "russian-soccer.firebaseapp.com",
  databaseURL: "https://russian-soccer.firebaseio.com",
  storageBucket: "russian-soccer.appspot.com",
  messagingSenderId: "476867980667"
};

firebase.initializeApp(config);

var database = firebase.database();

module.exports = {
  database: database
};