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
            games: data.gameList,
            scorers: data.scorers,
            assists: data.assists,
            glas: data.glas,
            winners: data.winners
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
    gameTool.loadPlayersPageData('name', function (players) {
        console.log('Player list ', players);
        response.render('pages/players', {
            players: players
        });
    });
});

app.get('/scorers', function (request, response) {
    gameTool.loadPlayersPageData('goal', function (players) {
        console.log('Player list ', players);
        response.render('pages/scorers', {
            scorers: players
        });
    });
});

app.get('/assists', function (request, response) {
    gameTool.loadPlayersPageData('assist', function (players) {
        console.log('Player list ', players);
        response.render('pages/assists', {
            assists: players
        });
    });
});


app.get('/glas', function (request, response) {
    gameTool.loadPlayersPageData('glas', function (players) {
        console.log('Player list ', players);
        response.render('pages/glas', {
            glas: players
        });
    });
});

app.get('/player/:playerId', function (request, response) {
    gameTool.loadPlayerProfilePageData(request.params.playerId, function (player) {
        console.log('Player profile ', player);
        response.render('pages/player', {
            player: player
        });
    });
});

app.get('/winners', function (request, response) {
    gameTool.loadWinnersPageData('point', function (winners) {
        console.log('Winners', winners);
        response.render('pages/winners', {
        	winners: winners
        });
    });
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
