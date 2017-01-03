var express = require('express');
var gameTool = require('./game');
var statTool = require('./stat');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var nav = [
    {
        title: 'Home',
        icon: 'home',
        url: '/'
    },
    {
        title: 'Games',
        icon: 'cd',
        url: '/games'
    },
    {
        title: 'All players',
        icon: 'user',
        url: '/players'
    },
    {
        title: 'Scorers',
        icon: 'record',
        url: '/scorers'
    },
    {
        title: 'Assists',
        icon: 'thumbs-up',
        url: '/assists'
    },
    {
        title: 'Goal + Pass',
        icon: 'star',
        url: '/glas'
    },
    {
        title: 'Winners',
        icon: 'asterisk',
        url: '/winners'
    },
    {
        title: 'Captains',
        icon: 'king',
        url: '/captains'
    }
];

getNavFor = function(url) {
    for(var i = 0; i < nav.length; i++) {
        if (nav[i].url == url) {
            nav[i].active = true;
        } else {
            nav[i].active = false;
        }
    }
    return nav;
};

app.get('/', function (request, response) {
    var year = new Date().getFullYear();
    gameTool.loadIndexPageData(year, function (data) {
        var uiData = {
                lastGame: data.lastGame,
                games: data.gameList,
                scorers: data.scorers,
                assists: data.assists,
                glas: data.glas,
                winners: data.winners,
                captains: data.captains,
                years: data.years,
                currentYear: year,
                nav: getNavFor('/')
            };
        console.log('Index page data ', uiData);
        response.render('pages/index', uiData);
    });
});

app.get('/year/:year', function (request, response) {
    var year = request.params.year;
    gameTool.loadIndexPageData(year, function (data) {
        console.log('Index page data ', data.gameList);
        response.render('pages/index', {
            lastGame: data.lastGame,
            games: data.gameList,
            scorers: data.scorers,
            assists: data.assists,
            glas: data.glas,
            winners: data.winners,
            captains: data.captains,
            years: data.years,
            currentYear: year,
            nav: getNavFor('/')
        });
    });
});

app.get('/api/1.0/index', function (request, response) {
    gameTool.loadGamesPageData(function (games) {
        var data = {
            lastGame: data.lastGame,
            games: data.gameList,
            scorers: data.scorers,
            assists: data.assists,
            glas: data.glas,
            winners: data.winners,
            captains: data.captains
        };
        console.log('Games list ', data);
        response.end( JSON.stringify(data));
    });
});

app.get('/games/:year', function (request, response) {
    var year = request.params.year;
    gameTool.loadGamesPageData(year, function (data) {
        console.log('Games list ', data);
        response.render('pages/games', {
            games: data.games,
            years: data.years,
            currentYear: year,
            nav: getNavFor('/games')
        });
    });
});

app.get('/api/1.0/games', function (request, response) {
    gameTool.loadGamesPageData(function (games) {
        console.log('Games list ', games);
        response.end( JSON.stringify(games));
    });
});

app.get('/game/:year/:gameId', function (request, response) {
    gameTool.loadOneGamePageData(request.params.year, request.params.gameId, function (data) {
        console.log('Single game ', data);
        response.render('pages/single_game', {
            game: data.game,
            gameStat: data.gameStat,
            years: data.years,
            nav: getNavFor('')
        });
    });
});

app.get('/api/1.0/game/:gameId', function (request, response) {
    gameTool.loadOneGamePageData(request.params.gameId, function (data) {
        console.log('Single game ', data);
        var data = {
            game: data.game,
            gameStat: data.gameStat,
            nav: getNavFor('')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/players', function (request, response) {
    gameTool.loadPlayersPageData('name', function (players) {
        console.log('Player list ', players);
        response.render('pages/players', {
            players: players,
            nav: getNavFor('/players')
        });
    });
});

app.get('/api/1.0/players', function (request, response) {
    gameTool.loadPlayersPageData('name', function (players) {
        console.log('Player list ', players);
        var data = {
            players: players,
            nav: getNavFor('/players')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/scorers/:year', function (request, response) {
    var year = request.params.year;
    gameTool.loadPlayersPageData(year, 'goal', function (data) {
        console.log('Player list ', data);
        response.render('pages/scorers', {
            scorers: data.stat,
            years: data.years,
            nav: getNavFor('/scorers')
        });
    });
});

app.get('/api/1.0/scorers', function (request, response) {
    gameTool.loadPlayersPageData('goal', function (players) {
        console.log('Player list ', players);
        var data = {
            scorers: players,
            nav: getNavFor('/scorers')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/assists', function (request, response) {
    gameTool.loadPlayersPageData('assist', function (players) {
        console.log('Player list ', players);
        response.render('pages/assists', {
            assists: players,
            nav: getNavFor('/assists')
        });
    });
});


app.get('/api/1.0/assists', function (request, response) {
    gameTool.loadPlayersPageData('assist', function (players) {
        console.log('Player list ', players);
        var data = {
            assists: players,
                nav: getNavFor('/assists')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/glas', function (request, response) {
    gameTool.loadPlayersPageData('glas', function (players) {
        console.log('Player list ', players);
        response.render('pages/glas', {
            glas: players,
            nav: getNavFor('/glas')
        });
    });
});

app.get('/api/1.0/glas', function (request, response) {
    gameTool.loadPlayersPageData('glas', function (players) {
        console.log('Player list ', players);
        var data = {
            glas: players,
            nav: getNavFor('/glas')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/player/:playerId', function (request, response) {
    gameTool.loadPlayerProfilePageData(request.params.playerId, function (player) {
        console.log('Player profile ', player);
        response.render('pages/player', {
            player: player,
            nav: getNavFor('')
        });
    });
});

app.get('/api/1.0/player/:playerId', function (request, response) {
    gameTool.loadPlayerProfilePageData(request.params.playerId, function (player) {
        console.log('Player profile ', player);
        var data = {
            player: player,
            nav: getNavFor('')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/winners', function (request, response) {
    gameTool.loadWinnersPageData('point', function (winners) {
        console.log('Winners', winners);
        response.render('pages/winners', {
        	winners: winners,
            nav: getNavFor('/winners')
        });
    });
});

app.get('/api/1.0/winners', function (request, response) {
    gameTool.loadWinnersPageData('point', function (winners) {
        console.log('Winners', winners);
        var data = {
            winners: winners,
            nav: getNavFor('/winners')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/captains', function (request, response) {
    gameTool.loadCaptainsPageData('point', function (captains) {
        console.log('Captains', captains);
        response.render('pages/captains', {
            captains: captains,
            nav: getNavFor('/captains')
        });
    });
});

app.get('/api/1.0/captains', function (request, response) {
    gameTool.loadCaptainsPageData('point', function (captains) {
        console.log('Captains', captains);
        var data = {
            captains: captains,
            nav: getNavFor('/captains')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/trinity/:size', function (request, response) {
    gameTool.loadTrinityPageData(request.params.size, 'point', function (trinity) {
        console.log('Trinity', trinity);
        response.render('pages/trinity', {
            trinity: trinity,
            nav: getNavFor('')
        });
    });
});

app.get('/api/1.0/trinity/:size', function (request, response) {
    gameTool.loadTrinityPageData(request.params.size, 'point', function (trinity) {
        console.log('Trinity', trinity);
        var data = {
            trinity: trinity,
            nav: getNavFor('')
        };
        response.end( JSON.stringify(data));
    });
});

app.get('/test', function (request, response) {
    response.render('pages/response');
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});