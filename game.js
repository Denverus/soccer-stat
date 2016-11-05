var firebase = require('./firebase');
var async = require('async');

module.exports = {

    loadIndexPageData: function (response) {
        loadConfig(function (config) {
            async.series({
                lastGame: function (callback) {
                    loadFullGame(config.lastgame, function (game) {
                        callback(null, game);
                    });
                },
                gameList: function (callback) {
                    loadAllGames(function (allGames) {
                        callback(null, allGames);
                    });
                },
                scorers: function (callback) {
                    loadAllPlayersStat('goal', function (players) {
                        callback(null, players);
                    });
                },
                assists: function (callback) {
                    loadAllPlayersStat('assist', function (players) {
                        callback(null, players);
                    });
                },
                glas: function (callback) {
                    loadAllPlayersStat('glas', function (players) {
                        callback(null, players);
                    });
                }
            }, function (err, results) {
                response(results);
            });
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
    loadPlayersPageData: function (order, response) {
        loadAllPlayersStat(order, function (players) {
            response(players);
        });
    }
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

loadConfig = function (response) {
    firebase.database.ref('/config').once('value').then(function (snapshot) {
        response(snapshot.val());
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

convertListToArray = function (list) {
    if (list == null) {
        return [];
    }
    var objKeysArray = Object.keys(list);
    var resultArray = [];
    for (var objKey in objKeysArray) {
        var objId = objKeysArray[objKey];
        var obj = list[objId];
        resultArray.push(obj);
    }

    return resultArray;
}

createPlayerStatObj = function(playerProp) {
    var player = {
        name: playerProp,
        games: 0,
        goals: 0,
        assists: 0,
        glas: 0
    };
    return player;
}

calcPlayerAppereance = function(playerMap, squad) {
    for (var playerProp in squad) {
        if (squad.hasOwnProperty(playerProp)) {
            var player = playerMap.get(playerProp);
            if (player != null) {
                player.games++;
            } else {
                var player = createPlayerStatObj(playerProp);
                player.games = 1;
                playerMap.set(playerProp, player);
            }
        }
    }
}

loadAllPlayersStat = function (order, response) {
    firebase.database.ref('/games').once('value').then(function (snapshot) {
        var games = snapshot.val();
        var playerArray = [];
        var playerMap = new Map();

        for (var gameProp in games) {
            if (games.hasOwnProperty(gameProp)) {
                var game = games[gameProp];

                calcPlayerAppereance(playerMap, game.color.squad);
                calcPlayerAppereance(playerMap, game.white.squad);

                var events = game.events;
                for (var eventProp in events) {
                    if (events.hasOwnProperty(eventProp)) {
                        var event = events[eventProp];

                        var author = event.author;
                        var assist = event.assist;

                        var player = playerMap.get(author);
                        if (player == null) {
                            player = createPlayerStatObj(author);
                        }
                        player.goals++;
                        player.glas++;

                        if (assist != null) {
                            player = playerMap.get(author);
                            if (player == null) {
                                player = createPlayerStatObj(assist);
                            }
                            player.assists++;
                            player.glas++;
                        }
                    }
                }
            }
        }
        playerMap.forEach(function(value, key) {
            playerArray.push(value);
        });

        playerArray.sort(function(a, b) {
            if (order == 'goal') {
                return b.goals - a.goals;
            }
            if (order == 'assist') {
                return b.assists - a.assists;
            }
            if (order == 'glas') {
                return b.glas - a.glas;
            }
            return a.name.localeCompare(b.name);
        });

        response(playerArray);
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