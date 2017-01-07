var firebase = require('./firebase');
var async = require('async');

var games_brunch = '/games_new';

module.exports = {

    loadIndexPageData: function (year, response) {
        loadLastGameId(year, function (lastGameId) {
            async.series({
                lastGame: function (callback) {
                    loadOneGame(year, lastGameId, function (game) {
                        callback(null, game);
                    });
                },
                gameList: function (callback) {
                    loadAllGames(year, function (allGames) {
                        callback(null, allGames);
                    });
                },
                scorers: function (callback) {
                    loadAllPlayersStat(year, 'goal', function (players) {
                        callback(null, players);
                    });
                },
                assists: function (callback) {
                    loadAllPlayersStat(year, 'assist', function (players) {
                        callback(null, players);
                    });
                },
                glas: function (callback) {
                    loadAllPlayersStat(year, 'glas', function (players) {
                        callback(null, players);
                    });
                },
                winners: function (callback) {
                    loadWinners(year, 'record', function (winners) {
                        callback(null, winners);
                    });
                },
                captains: function (callback) {
                    loadCaptainsStat(year, 'record', function (captains) {
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
    loadGamesPageData: function (year, response) {
        async.series({
            games: function (callback) {
                loadAllGames(year, function (games) {
                    callback(null, games);
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
    loadOneGamePageData: function (year, gameId, response) {
        async.series({
            game: function (callback) {
                loadOneGame(year, gameId, function (game) {
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
    loadPlayerProfilePageData: function (year, playerId, response) {
        async.series({
            player: function (callback) {
                loadPlayerProfile(year, playerId, function (player) {
                    callback(null, player);
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
    loadWinnersPageData: function (year, order, response) {
        async.series({
            winners: function (callback) {
                loadWinners(year, order, function (winners) {
                    callback(null, winners);
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
    loadCaptainsPageData: function (year, order, response) {
        async.series({
            captains: function (callback) {
                loadCaptainsStat(year, order, function (captains) {
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
    },
    loadTrinityPageData: function (size, order, response) {
        loadTrinityStat(size, order, function (trinity) {
            response(trinity);
        });
    },
    loadRatingsPageData: function (response) {
        async.series({
            ratings: function (callback) {
                loadRatings(function (ratings) {
                    callback(null, ratings);
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
    loadRatingsMathPageData: function (player, response) {
        async.series({
            math: function (callback) {
                loadRatingsMath(player, function (math) {
                    callback(null, math);
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
    copyEvents: function () {
        //copyEvents();
    }
};

loadConfig = function (response) {
    firebase.database.ref('/config').once('value').then(function (snapshot) {
        response(snapshot.val());
    });
}

loadLastGameId = function (year, response) {
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
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

addStatFieldToPlayers = function (squad) {
    for (var playerId in squad) {
        var player = squad[playerId];
        var newPlayer = {
            name: playerId,
            goals: 0,
            assists: 0,
            glas: 0,
            time: player.time
        };
        squad[playerId] = newPlayer;
    }
}

calcPlayerStatInGame = function (event, squad) {
    if (event.type == null) {
        var author = squad[event.author];
        var assist = squad[event.assist];

        if (author != null) {
            author.goals++;
            author.glas++;
        }

        if (assist != null) {
            assist.assists++;
            assist.glas++;
        }
    }
}

loadOneGame = function (year, gameId, response) {
    firebase.database.ref(games_brunch + '/' + year + '/' + gameId).once('value').then(function (snapshot) {
        var game = snapshot.val();
        game.id = gameId;

        var whiteSquad = game.white.squad;
        var colorSquad = game.color.squad;

        addStatFieldToPlayers(whiteSquad);
        addStatFieldToPlayers(colorSquad);

        var events = game.events;
        // Convert events to array
        var eventsArray = new Array;
        var whiteGoals = 0;
        var colorGoals = 0;
        for (var o in events) {
            var event = events[o];
            eventsArray.push(event);

            // Calc player stat
            if (event.team == 'white') {
                calcPlayerStatInGame(event, whiteSquad);
                if (event.type == null) {
                    whiteGoals++;
                }
            }
            if (event.team == 'color') {
                calcPlayerStatInGame(event, colorSquad);
                if (event.type == null) {
                    colorGoals++;
                }
            }

            event.score = whiteGoals + ':' + colorGoals;
        }

        game.white.squad = whiteSquad;
        game.color.squad = colorSquad;

        // Put events (now as array) back to game object
        game.events = eventsArray;

        response(game);
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
        ownGoals: 0,
        assists: 0,
        glas: 0
    };
    return player;
}

calcPlayerAppereance = function (playerMap, squad1, squad2) {
    var tmpMap = new Map();
    for (var playerProp in squad1) {
        if (squad1.hasOwnProperty(playerProp)) {
            tmpMap.set(playerProp, playerProp);
        }
    }
    for (var playerProp in squad2) {
        if (squad2.hasOwnProperty(playerProp)) {
            tmpMap.set(playerProp, playerProp);
        }
    }

    tmpMap.forEach(function (value, key, map) {
        var player = playerMap.get(key);
        if (player != null) {
            player.games++;
        } else {
            var player = createPlayerStatObj(key);
            player.games = 1;
            playerMap.set(key, player);
        }
    });
}

loadAllPlayersStat = function (year, order, response) {
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
        var games = snapshot.val();
        var playerArray = [];
        var playerMap = new Map();

        for (var gameProp in games) {
            if (games.hasOwnProperty(gameProp)) {
                var game = games[gameProp];

                calcPlayerAppereance(playerMap, game.color.squad, game.white.squad);

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
                        if (event.type == 'owngoal') {
                            var author = event.author;
                            var player = playerMap.get(author);
                            if (player == null) {
                                player = createPlayerStatObj(author);
                            }
                            player.ownGoals++;
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

loadPlayerProfile = function (year, playerId, response) {
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
        var games = snapshot.val();
        var player = {
            name: playerId,
            summary: {
                games: 0,
                goals: 0,
                assists: 0,
                glas: 0,
                ownGoals: 0,
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
                    ownGoals: 0,
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
                        if (event.type == 'owngoal') {
                            var author = event.author;
                            player.summary.ownGoals++;
                            game.ownGoals++;
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

loadWinners = function (year, order, response) {
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
        var games = snapshot.val();

        var playerMap = new Map();

        for (var gameProp in games) {
            if (games.hasOwnProperty(gameProp)) {
                var game = games[gameProp];

                var colorSquad = game.color.squad;
                var whiteSquad = game.white.squad;

                var players = new Map();

                calcPlayerAppereance(players, colorSquad, whiteSquad);

                players.forEach(function (value, key, map) {
                    var playerId = key;
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
                });

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

loadCaptainsStat = function (year, order, response) {
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
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

loadRatings = function (response) {
    var ratings = [];
    ratings.push(
        {
            id: 'denis',
            name: 'denis',
            game1: 10,
            game2: 11,
            game3: 12,
            game4: 13,
            game5: 14,
            points: 55,
            progress_place: 5,
            progress_point: 10
        }
    );
    ratings.push(
        {
            id: 'vadim',
            name: 'vadim',
            game1: 10,
            game2: 11,
            game3: 12,
            game4: 13,
            game5: 14,
            points: 52,
            progress_place: 5,
            progress_point: 10
        }
    );
    ratings.push(
        {
            id: 'max',
            name: 'max',
            game1: 10,
            game2: 11,
            game3: 12,
            game4: 13,
            game5: 14,
            points: 51,
            progress_place: 5,
            progress_point: 10
        }
    );
    response(ratings);
}

loadRatingsMath = function (player, response) {
    var gamesStat = [];
    var math = {
        player: {
            name: 'denis',
            id: 'denis'
        },
        wins: 3,
        draws: 1,
        played: 5,
        games: []
    };
    gamesStat.push(
        {
            date: '1-6-2017',
            title: 'White - Color 4:5',
            url: '2017/0102',
            played: true,
            team: 'white',
            win: true,
            goals: 10,
            own_goals: 11,
            assists: 12,
            team_scored: 13,
            team_conceded: 14,
            points: 55,
            progress_place: 5,
            progress_point: 10
        }
    );
    gamesStat.push(
        {
            date: '1-4-2017',
            title: 'White - Color 1:3',
            url: '2017/0102',
            played: true,
            team: 'color',
            goals: 10,
            own_goals: 11,
            assists: 12,
            team_scored: 13,
            team_conceded: 14,
            points: 55,
            progress_place: 5,
            progress_point: 10
        }
    );
    gamesStat.push(
        {
            date: '1-2-2017',
            title: 'White - Color 3:3',
            url: '2017/0102',
            played: true,
            team: 'color',
            goals: 10,
            own_goals: 11,
            assists: 12,
            team_scored: 13,
            team_conceded: 14,
            points: 55,
            progress_place: 5,
            progress_point: 10
        }
    );
    math.games = gamesStat;
    response(math);
}