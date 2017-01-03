var firebase = require('./firebase');
var async = require('async');

var games_brunch = '/games_new';

module.exports = {

    loadIndexPageData: function (year, response) {
        loadLastGameId(year, function (lastGameId) {
            async.series({
                lastGame: function (callback) {
                    loadFullGame(year, lastGameId, function (game) {
                        callback(null, game);
                    });
                },
                gameList: function (callback) {
                    loadAllGames(year, function (allGames) {
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
                },
                winners: function (callback) {
                    loadWinners('record', function (winners) {
                        callback(null, winners);
                    });
                },
                captains: function (callback) {
                    loadCaptainsStat('record', function (captains) {
                        callback(null, captains);
                    });
                },
                years: function (callback) {
                    getListOfYears(function (years) {
                        callback(null, years);
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
    loadOneGamePageData: function (year, gameId, response) {
        async.series({
            game: function (callback) {
                loadOneGame(year, gameId, function (game) {
                    callback(null, game);
                });
            },
            gameStat: function (callback) {
                loadFullGame(year, gameId, function (game) {
                    callback(null, game);
                });
            },
            years: function (callback) {
                getListOfYears(function (years) {
                    callback(null, years);
                });
            }
        }, function (err, results) {
            response(results);
        });
    },
    loadPlayersPageData: function (year, order, response) {
        async.series({
            stat: function (callback) {
                loadAllPlayersStat(year, order, function (players) {
                    callback(null, players);
                });
            },
            years: function (callback) {
                getListOfYears(function (years) {
                    callback(null, years);
                });
            }
        }, function (err, results) {
            response(results);
        });
    },
    loadPlayerProfilePageData: function (playerId, response) {
        loadPlayerProfile(playerId, function (player) {
            response(player);
        });
    },
    loadWinnersPageData: function (order, response) {
        loadWinners(order, function (winners) {
            response(winners);
        });
    },
    loadCaptainsPageData: function (order, response) {
        loadCaptainsStat(order, function (captains) {
            response(captains);
        });
    },
    loadTrinityPageData: function (size, order, response) {
        loadTrinityStat(size, order, function (trinity) {
            response(trinity);
        });
    },
    copyEvents: function () {
        //copyEvents();
    }
};

loadFullGame = function (year, gameId, response) {
    async.series({
        game: function (callback) {
            loadOneGame(year, gameId, function (game) {
                callback(null, game);
            });
        },
        score: function (callback) {
            loadScore(year, gameId, function (score) {
                callback(null, score);
            });
        },
        white: function (callback) {
            loadSquad(year, gameId, true, function (squad) {
                callback(null, squad);
            });
        },
        color: function (callback) {
            loadSquad(year, gameId, false, function (squad) {
                callback(null, squad);
            });
        },
        events: function (callback) {
            loadEvents(year, gameId, function (squad) {
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

loadLastGameId = function (year, response) {
    firebase.database.ref(games_brunch + '/'+year).once('value').then(function (snapshot) {
        var games = snapshot.val();
        var gamesIndexArray = Object.keys(games);
        var gamesArray = [];
        for (var gameKey in gamesIndexArray) {
            var gameId = gamesIndexArray[gameKey];
            var game = games[gameId];
            game.year = year;
            game.id = gameId;
            gamesArray.push(game);
        }
        gamesArray.sort(function (a, b) {
            return b.id.localeCompare(a.id);
        });
        if (gamesArray.length > 0) {
            response(gamesArray[0].id);
        } else {
            response(null);
        }
    });
}

loadOneGame = function (year, gameId, response) {
    firebase.database.ref(games_brunch + '/'+year + '/' + gameId).once('value').then(function (snapshot) {
        var game = snapshot.val();
        game.id = gameId;
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

loadScore = function (year, gameId, response) {
    firebase.database.ref(games_brunch + '/' + year + '/' + gameId).once('value').then(function (snapshot) {
        var game = snapshot.val();
        var score = {
            color: game.color.score,
            white: game.white.score
        };
        response(score);
    });
}

loadDate = function (year, gameId, response) {
    firebase.database.ref(games_brunch + '/' + year + '/' + gameId).once('value').then(function (snapshot) {
        var game = snapshot.val();
        response(game.date);
    });
}

loadSquad = function (year, gameId, white, response) {
    var team = 'color';
    if (white) {
        team = 'white';
    }
    ;
    firebase.database.ref(games_brunch + '/' + year + '/' + gameId + '/' + team + '/squad').once('value').then(function (snapshot) {
        var squad = snapshot.val();
        var dataArray = new Array;
        for (var o in squad) {
            squad[o].name = o;
            dataArray.push(squad[o]);
        }
        response(dataArray);
    });
}


loadEvents = function (year, gameId, response) {
    firebase.database.ref(games_brunch + '/' + year + '/' + gameId + '/events').once('value').then(function (snapshot) {
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

loadAllGames = function (year, response) {
    //firebase.database.ref('/games').once('value').then(function (snapshot) {
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
        var games = snapshot.val();
        var gamesArray = [];

        var gamesIndexArray = Object.keys(games);
        for (var gameKey in gamesIndexArray) {
            var gameId = gamesIndexArray[gameKey];
            var game = games[gameId];
            game.year = year;
            game.id = gameId;
            game.playersCount = calcPlayerCount(game);
            gamesArray.push(game);
        }
        gamesArray.sort(function (a, b) {
            return b.id.localeCompare(a.id);
        });
        response(gamesArray);
    });
}

calcPlayerCount = function (game) {
    if (game.color.squad == null || game.white.squad == null) {
        return null;
    }

    var colorSquadArray = Object.keys(game.color.squad);
    var whiteSquadArray = Object.keys(game.white.squad);

    if (colorSquadArray != null && whiteSquadArray != null) {
        return colorSquadArray.length + whiteSquadArray.length;
    }

    return null;
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

createPlayerStatObj = function (playerProp) {
    var player = {
        name: playerProp,
        games: 0,
        goals: 0,
        assists: 0,
        glas: 0
    };
    return player;
}

calcPlayerAppereance = function (playerMap, squad) {
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

loadAllPlayersStat = function (year, order, response) {
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
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

                        if (event.type == null) {
                            var author = event.author;
                            var assist = event.assist;

                            var player = playerMap.get(author);
                            if (player == null) {
                                player = createPlayerStatObj(author);
                            }
                            player.goals++;
                            player.glas++;

                            if (assist != null) {
                                player = playerMap.get(assist);
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
        }
        playerMap.forEach(function (value, key) {
            playerArray.push(value);
        });

        playerArray.sort(function (a, b) {
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

loadPlayerProfile = function (playerId, response) {
    firebase.database.ref('/games').once('value').then(function (snapshot) {
        var games = snapshot.val();
        var player = {
            name: playerId,
            summary: {
                games: 0,
                goals: 0,
                assists: 0,
                glas: 0,
                wins: 0,
                draws: 0,
                losses: 0
            },
            games: []
        };

        for (var gameProp in games) {
            if (games.hasOwnProperty(gameProp)) {
                var dbGame = games[gameProp];

                var result = "White - Color " + dbGame.white.score + ":" + dbGame.color.score;

                var game = {
                    num: dbGame.num,
                    date: dbGame.date,
                    time: 100,
                    game: result,
                    gameId: gameProp,
                    team: null,
                    win: null,
                    goals: 0,
                    assists: 0,
                    glas: 0
                };
                var squadColor = dbGame.color.squad;
                var squadWhite = dbGame.white.squad;
                var whiteWon = 0;
                var colorWon = 0;
                var draw = 0;
                if (dbGame.color.score > dbGame.white.score) {
                    colorWon = 1;
                }
                if (dbGame.color.score < dbGame.white.score) {
                    whiteWon = 1;
                }
                if (dbGame.color.score == dbGame.white.score) {
                    draw = 1;
                }

                var squadTime = {
                    color: calcPlayedTime(playerId, squadColor),
                    white: calcPlayedTime(playerId, squadWhite)
                };

                if (squadTime.white > 0 || squadTime.color > 0) {
                    player.summary.games++;
                    if (squadTime.white > squadTime.color) {
                        game.team = 'white';
                    } else {
                        game.team = 'color';
                    }
                }

                calcGameAttendanceStat(playerId, squadTime, squadColor, 'color', 'white', colorWon, whiteWon, draw, player.summary, game);
                calcGameAttendanceStat(playerId, squadTime, squadWhite, 'white', 'color', whiteWon, colorWon, draw, player.summary, game);

                var events = dbGame.events;
                for (var eventProp in events) {
                    if (events.hasOwnProperty(eventProp)) {
                        var event = events[eventProp];

                        if (event.type == null) {
                            var author = event.author;
                            var assist = event.assist;

                            if (author == playerId) {
                                player.summary.goals++;
                                game.goals++;
                                player.summary.glas++;
                                game.glas++;
                            }

                            if (assist == playerId) {
                                player.summary.assists++;
                                game.assists++;
                                player.summary.glas++;
                                game.glas++;
                            }
                        }
                    }
                }

                player.games.push(game);
            }
        }

        player.games.sort(function (a, b) {
            return b.gameId.localeCompare(a.gameId);
        });

        response(player);
    });
}

calcPlayedTime = function (playerId, squad) {
    var result = 0;
    for (var squadProp in squad) {
        if (squad.hasOwnProperty(squadProp)) {
            var playerInSquad = squad[squadProp];
            if (squadProp == playerId) {
                return playerInSquad.time;
            }
        }
    }
    return 0;
}


allPlayersFromGame = function (game) {
    var players = [];
    var colorSquad = game.color.squad;
    var whiteSquad = game.white.squad;
    for (var squadProp in colorSquad) {
        if (colorSquad.hasOwnProperty(squadProp)) {
            players.push(squadProp);
        }
    }
    for (var squadProp in whiteSquad) {
        if (whiteSquad.hasOwnProperty(squadProp)) {
            players.push(squadProp);
        }
    }
    return players;
}

calcGameAttendanceStat = function (playerId, squadTime, squad, teamname, oppositeTeam, teamWon, opppositeWon, draw, summary, game) {
    var result = 0;
    for (var squadProp in squad) {
        if (squad.hasOwnProperty(squadProp)) {
            var playerInSquad = squad[squadProp];
            if (squadProp == playerId) {
                if (squadTime[teamname] > squadTime[oppositeTeam]) {
                    summary.wins += teamWon;
                    summary.draws += draw;
                    summary.losses += opppositeWon;
                    if (teamWon > 0) {
                        game.win = 1;
                    } else if (opppositeWon > 0) {
                        game.win = -1;
                    } else if (draw) {
                        game.win = 0
                    }
                }
            }
        }
    }
}

loadWinners = function (order, response) {
    firebase.database.ref('/games').once('value').then(function (snapshot) {
        var games = snapshot.val();

        var playerMap = new Map();

        for (var gameProp in games) {
            if (games.hasOwnProperty(gameProp)) {
                var game = games[gameProp];

                var players = allPlayersFromGame(game);

                var colorSquad = game.color.squad;
                var whiteSquad = game.white.squad;

                for (var index in players) {

                    var playerId = players[index];
                    var player = playerMap.get(playerId);
                    if (player == null) {
                        player = {
                            id: playerId,
                            name: playerId,
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            points: 0,
                            winsPers: 0
                        };
                    }

                    var squadTime = {
                        color: calcPlayedTime(playerId, colorSquad),
                        white: calcPlayedTime(playerId, whiteSquad)
                    };

                    if (squadTime.color > squadTime.white) {
                        if (game.color.score > game.white.score) {
                            player.wins++;
                        } else if (game.color.score < game.white.score) {
                            player.losses++;
                        } else if (game.color.score == game.white.score) {
                            player.draws++;
                        }
                    } else {
                        if (game.color.score < game.white.score) {
                            player.wins++;
                        } else if (game.color.score > game.white.score) {
                            player.losses++;
                        } else if (game.color.score == game.white.score) {
                            player.draws++;
                        }
                    }

                    playerMap.set(playerId, player);

                }
            }
        }

        var result = [];
        playerMap.forEach(function (value, key) {
            // Points
            value.points = value.wins * 3 + value.draws;
            // Wins percentage
            winsPers = value.wins / (value.wins + value.draws + value.losses);
            value.winsPers = Math.round(winsPers * 1000) / 1000;

            result.push(value);
        });

        result.sort(function (a, b) {
            return b.points - a.points;
        });

        response(result);
    });
}

calcGameWinnerStat = function (playerId, squadTime, squad, teamname, oppositeTeam, teamWon, opppositeWon, draw, summary, game) {
    var result = 0;
    for (var squadProp in squad) {
        if (squad.hasOwnProperty(squadProp)) {
            var playerInSquad = squad[squadProp];
            if (squadProp == playerId) {
                if (squadTime[teamname] > squadTime[oppositeTeam]) {
                    summary.wins += teamWon;
                    summary.draws += draw;
                    summary.losses += opppositeWon;
                    if (teamWon > 0) {
                        game.win = 1;
                    } else if (opppositeWon > 0) {
                        game.win = -1;
                    } else if (draw) {
                        game.win = 0
                    }
                }
            }
        }
    }
}

loadCaptainsStat = function (order, response) {
    firebase.database.ref('/games').once('value').then(function (snapshot) {
        var games = snapshot.val();

        var captainMap = new Map();

        for (var gameProp in games) {
            if (games.hasOwnProperty(gameProp)) {
                var game = games[gameProp];

                if (game.color.captain != null) {
                    updateCaptainStat(captainMap, game.color.captain, game.color.score, game.white.score);
                }
                if (game.white.captain != null) {
                    updateCaptainStat(captainMap, game.white.captain, game.white.score, game.color.score);
                }
            }
        }

        var result = [];
        captainMap.forEach(function (value, key) {
            // Points
            value.points = value.wins * 3 + value.draws;
            // Wins percentage
            winsPers = value.wins / (value.wins + value.draws + value.losses);
            value.winsPers = Math.round(winsPers * 1000) / 1000;

            result.push(value);
        });

        result.sort(function (a, b) {
            return b.points - a.points;
        });

        response(result);
    });
}

loadTrinityStat = function (size, order, response) {
    firebase.database.ref('/games').once('value').then(function (snapshot) {
        var games = snapshot.val();

        var trinityMap = new Map();

        for (var gameProp in games) {
            if (games.hasOwnProperty(gameProp)) {
                var game = games[gameProp];

                var allColorTrinity = allTrinityFromSquad(game.color.squad, size);
                var allWhiteTrinity = allTrinityFromSquad(game.white.squad, size);

                for (var colorTrinity in allColorTrinity) {
                    updateTrinityStat(trinityMap, allColorTrinity[colorTrinity], game.color.score, game.white.score);
                }
                for (var whiteTrinity in allWhiteTrinity) {
                    updateTrinityStat(trinityMap, allWhiteTrinity[whiteTrinity], game.white.score, game.color.score);
                }
            }
        }

        var result = [];
        trinityMap.forEach(function (value, key) {
            // Points
            value.points = value.wins * 3 + value.draws;

            var gamesCount = value.wins + value.draws + value.losses;

            // Wins percentage
            winsPers = value.wins / gamesCount;
            value.winsPers = Math.round(winsPers * 1000) / 1000;

            // Scored per game
            value.scoredPerGame = Math.round((value.scored * 100) / gamesCount) / 100;

            // Conceded per game
            value.concededPerGame = Math.round((value.conceded * 100) / gamesCount) / 100;

            result.push(value);
        });

        result.sort(function (a, b) {
            return b.points - a.points;
        });

        response(result);
    });
}

updateCaptainStat = function (captainMap, captainId, goalsScored, goalsConceded) {
    var captain = captainMap.get(captainId);
    if (captain == null) {
        captain = {
            id: captainId,
            name: captainId,
            wins: 0,
            draws: 0,
            losses: 0,
            points: 0,
            winsPers: 0
        };
    }

    if (goalsScored > goalsConceded) {
        captain.wins++;
    } else if (goalsScored < goalsConceded) {
        captain.losses++;
    } else if (goalsScored == goalsConceded) {
        captain.draws++;
    }

    captainMap.set(captainId, captain);
}

allTrinityFromSquad = function (squad, size) {
    var trinities = [];
    for (var squadProp in squad) {
        if (squad.hasOwnProperty(squadProp)) {
            trinities.push(squadProp);
        }
    }

    var result = [];
    /*for (var i=0; i<trinities.length; i++) {
     for (var j=i+1; j<trinities.length; j++) {
     for (var k=j+1; k<trinities.length; k++) {
     trinity = trinityId(trinities[i], trinities[j], trinities[k]);
     result.push(trinity);
     }
     }
     }*/

    doNestedLoop(trinities, [], 0, size, result);

    return result;
}

function doNestedLoop(squad, indexes, start, size, result) {
    if (indexes.length < size) {
        for (var i = start; i < squad.length; i++) {
            indexes.push(i);
            doNestedLoop(squad, indexes, i + 1, size, result);
            indexes.splice(indexes.length - 1, 1);
        }
    } else {
        var couple = [];
        for (var i = 0; i < indexes.length; i++) {
            couple.push(squad[indexes[i]]);
        }
        couple.sort(function (a, b) {
            return a.localeCompare(b);
        });
        console.log('New couple ', couple.toString());
        result.push(couple.toString());
    }
}

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}

trinityId = function (player1, player2, player3) {
    var playerArray = [player1, player2, player3];
    playerArray.sort(function (a, b) {
        return a.localeCompare(b);
    });
    return playerArray[0] + '_' + playerArray[1] + '_' + playerArray[2];
}

updateTrinityStat = function (trinityMap, trinityId, goalsScored, goalsConceded) {
    var trinity = trinityMap.get(trinityId);
    if (trinity == null) {
        trinity = {
            id: trinityId,
            name: trinityId,
            wins: 0,
            draws: 0,
            losses: 0,
            scored: 0,
            conceded: 0,
            points: 0,
            winsPers: 0,
            scoredPerGame: 0,
            concededPerGame: 0
        };
    }

    trinity.scored = trinity.scored + goalsScored;
    trinity.conceded = trinity.conceded + goalsConceded;

    if (goalsScored > goalsConceded) {
        trinity.wins++;
    } else if (goalsScored < goalsConceded) {
        trinity.losses++;
    } else if (goalsScored == goalsConceded) {
        trinity.draws++;
    }

    trinityMap.set(trinityId, trinity);
}

getListOfYears = function (response) {
    firebase.database.ref(games_brunch).once('value').then(function (snapshot) {

        var years = [];
        var games = snapshot.val();
        for (var yearProp in games) {
            years.push(yearProp);
        }
        response(years);
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


function copyFbRecord(oldRef, newRef) {
    oldRef.once('value', function (snap) {
        newRef.set(snap.val(), function (error) {
            if (error && typeof(console) !== 'undefined' && console.error) {
                console.error(error);
            }
        });
    });
};

copyEvents = function () {
    var fromRef = firebase.database.ref('games/');
    var toRef = firebase.database.ref('games_new/2016');
    //copyFbRecord(fromRef, toRef);
}