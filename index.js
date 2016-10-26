var express = require('express');
var firebase = require("firebase");
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

var config = {
apiKey: "AIzaSyDH8qA0uF6b8AfNeaB7oz_T57_y7PXurqo",
    authDomain: "russian-soccer.firebaseapp.com",
    databaseURL: "https://russian-soccer.firebaseio.com",
    storageBucket: "russian-soccer.appspot.com",
    messagingSenderId: "476867980667"
};
var mainApp = firebase.initializeApp(config);

var database = firebase.database();

firebase.database().ref('/players/player').once('value').then(function(snapshot) {
  var username = snapshot.val().FirstName;
  console.log('Player First Name is ', username);
});

var commentsRef = firebase.database().ref('players');
commentsRef.on('child_added', function(data) {
  console.log('Player ', data.val());
});