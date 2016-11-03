var express = require('express');
var gameTool = require('./game');
var statTool = require('./stat');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
    gameTool.loadIndexPageData(function (data) {
        console.log('Index page data ', data);
        response.render('pages/index', {
            lastGame: data.lastGame,
            games: data.gameList
        });
    });
});

app.get('/games', function (request, response) {
    gameTool.loadGamesPageData(function (games) {
        console.log('Games list ', games);
        response.render('pages/games', {
            games: games
        });
    });
});


app.get('/game/:gameId', function (request, response) {
    gameTool.loadOneGamePageData(request.params.gameId, function (data) {
        console.log('Single game ', data);
        response.render('pages/single_game', {
            game: data.game,
            gameStat: data.gameStat
        });
    });
});


app.get('/players', function (request, response) {
    gameTool.loadPlayersPageData(function (players) {
        console.log('Player list ', players);
        response.render('pages/players', {
            players: players
        });
    });
});

app.get('/scorers', function (request, response) {
    response.render('pages/scorers');
});

app.get('/assists', function (request, response) {
    response.render('pages/assists');
});

app.get('/teamranking', function (request, response) {
    response.render('pages/teamranking');
});

app.get('/test', function (request, response) {
    response.render('pages/response');
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

var config = {
    apiKey: "AIzaSyDH8qA0uF6b8AfNeaB7oz_T57_y7PXurqo",
    authDomain: "russian-soccer.firebaseapp.com",
    databaseURL: "https://russian-soccer.firebaseio.com",
    storageBucket: "russian-soccer.appspot.com",
    messagingSenderId: "476867980667"
};
