var firebase = require('./firebase');
var async = require('async');

module.exports = {

    loadIndexPageData: function (gameId, response) {
        async.series({
            lastGame: function (callback) {
                loadFullGame(gameId, function (game) {
                    callback(null, game);
                });
            },
            gameList: function (callback) {
                loadAllGames(function (allGames) {
                    callback(null, allGames);
                });
            }
        }, function (err, results) {
            response(results);
        });
    },
    loadGamesPageData: function (response) {
        loadAllGames(function (games) {
            response(games);
        });
    },
    loadOneGamePageData: function (gameId, response) {
        async.series({
            game: function (callback) {
                loadOneGame(gameId, function (game) {
                    callback(null, game);
                });
            },
            gameStat: function (callback) {
                loadFullGame(gameId, function (game) {
                    callback(null, game);
                });
            }
        }, function (err, results) {
            response(results);
        });
    },
};

loadFullGame = function (gameId, response) {
    async.series({
        game: function (callback) {
            loadOneGame(gameId, function (game) {
                callback(null, game);
            });
        },
        score: function (callback) {
            loadScore(gameId, function (score) {
                callback(null, score);
            });
        },
        white: function (callback) {
            loadSquad(gameId, true, function (squad) {
                callback(null, squad);
            });
        },
        color: function (callback) {
            loadSquad(gameId, false, function (squad) {
                callback(null, squad);
            });
        },
        events: function (callback) {
            loadEvents(gameId, function (squad) {
                callback(null, squad);
            });
        }
    }, function (err, results) {
        response(results);
    });
}

loadOneGame = function (gameId, response) {
    firebase.database.ref('/games/' + gameId).once('value').then(function (snapshot) {
        var game = snapshot.val();
        response(game);
    });
}

loadGameShort = function (gameId, response) {
    async.series({
        score: function (callback) {
            loadScore(gameId, function (score) {
                callback(null, score);
            });
        },
        date: function (callback) {
            loadDate(gameId, function (date) {
                callback(null, date);
            });
        },
    }, function (err, results) {
        response(results);
    });
}

loadScore = function (gameId, response) {
    firebase.database.ref('/games/' + gameId).once('value').then(function (snapshot) {
        var game = snapshot.val();
        var score = {
            color: game.color.score,
            white: game.white.score
        };
        response(score);
    });
}

loadDate = function (gameId, response) {
    firebase.database.ref('/games/' + gameId).once('value').then(function (snapshot) {
        var game = snapshot.val();
        response(game.date);
    });
}

loadSquad = function (gameId, white, response) {
    var team = 'color';
    if (white) {
        team = 'white';
    }
    ;
    firebase.database.ref('/games/' + gameId + '/' + team + '/squad').once('value').then(function (snapshot) {
        var squad = snapshot.val();
        var dataArray = new Array;
        for (var o in squad) {
            squad[o].name = o;
            dataArray.push(squad[o]);
        }
        response(dataArray);
    });
}


loadEvents = function (gameId, response) {
    firebase.database.ref('/games/' + gameId + '/events').once('value').then(function (snapshot) {
        var events = snapshot.val();
        var dataArray = new Array;
        for (var o in events) {
            dataArray.push(events[o]);
        }
        response(dataArray);
    });
}

loadPlayer = function (playerid, response) {
    firebase.database.ref('/players/' + playerid).once('value').then(function (snapshot) {
        var player = snapshot.val();
        response(player);
    });
}

loadAllGames = function (response) {
    firebase.database.ref('/games').once('value').then(function (snapshot) {
        var games = snapshot.val();
        var gamesArray = [];

        var gamesIndexArray = Object.keys(games);
        for (var gameKey in gamesIndexArray) {
            var gameId = gamesIndexArray[gameKey];
            var game = games[gameId];
            game.id = gameId;
            gamesArray.push(game);
        }
        response(gamesArray);
    });
}

asyncLoop = function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function () {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        iteration: function () {
            return index - 1;
        },

        break: function () {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}