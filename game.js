var firebase = require('./firebase');
var async = require('async');
var fs = require('fs');

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
                ratings: function (callback) {
                    loadRatings(function (ratings) {
                        callback(null, ratings);
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
                } else if (event.type == 'owngoal') {
                    whiteGoals++;
                }
            }
            if (event.team == 'color') {
                calcPlayerStatInGame(event, colorSquad);
                if (event.type == null) {
                    colorGoals++;
                } else if (event.type == 'owngoal') {
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

calcPLayerStatInGame = function (playerId, gameId, dbGame) {
    var result = "White - Color " + dbGame.white.score + ":" + dbGame.color.score;

    var game = {
        num: dbGame.num,
        date: dbGame.date,
        time: 100,
        game: result,
        gameId: gameId,
        team: null,
        win: null,
        goals: 0,
        assists: 0,
        ownGoals: 0,
        glas: 0,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        team_scored: 0,
        team_conceded: 0
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
        game.games++;
        if (squadTime.white > squadTime.color) {
            game.team = 'white';
            game.team_scored = dbGame.white.score;
            game.team_conceded = dbGame.color.score;
        } else {
            game.team = 'color';
            game.team_scored = dbGame.color.score;
            game.team_conceded = dbGame.white.score;
        }
    }

    calcGameAttendanceStat(playerId, squadTime, squadColor, 'color', 'white', colorWon, whiteWon, draw, game);
    calcGameAttendanceStat(playerId, squadTime, squadWhite, 'white', 'color', whiteWon, colorWon, draw, game);

    var events = dbGame.events;
    for (var eventProp in events) {
        if (events.hasOwnProperty(eventProp)) {
            var event = events[eventProp];

            if (event.type == null) {
                var author = event.author;
                var assist = event.assist;

                if (author == playerId) {
                    game.goals++;
                    game.glas++;
                }

                if (assist == playerId) {
                    game.assists++;
                    game.glas++;
                }
            }
            if (event.type == 'owngoal') {
                var author = event.author;
                if (playerId == author) {
                    game.ownGoals++;
                }
            }
        }
    }

    return game;
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

                var game = calcPLayerStatInGame(playerId, gameProp, dbGame);

                player.summary.goals += game.goals;
                player.summary.assists += game.assists;
                player.summary.glas += game.glas;
                player.summary.ownGoals += game.ownGoals;
                player.summary.games += game.games;
                player.summary.wins += game.wins;
                player.summary.draws += game.draws;
                player.summary.losses += game.losses;

                player.games.push(game);
            }
        }

        
        var picture_path = __dirname+'/public/images/players/'+player.name+'.jpg';

        console.log('Folder ', picture_path);
        
        // profile picture checking
        if (fs.existsSync(picture_path)) {
            player.img = '/images/players/'+player.name+'.jpg';
        } else {
            player.img = '/images/players/'+'none.jpg';
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

calcGameAttendanceStat = function (playerId, squadTime, squad, teamname, oppositeTeam, teamWon, oppositeWon, draw, game) {
    var result = 0;
    for (var squadProp in squad) {
        if (squad.hasOwnProperty(squadProp)) {
            var playerInSquad = squad[squadProp];
            if (squadProp == playerId) {
                if (squadTime[teamname] > squadTime[oppositeTeam]) {
                    game.wins += teamWon;
                    game.draws += draw;
                    game.losses += oppositeWon;
                    if (teamWon > 0) {
                        game.win = 1;
                    } else if (oppositeWon > 0) {
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
                            winsPers: 0,
                            team_scored: 0,
                            team_conceded: 0,
                            team_scored_per_game: 0,
                            team_conceded_per_game: 0
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
                        player.team_scored += game.color.score;
                        player.team_conceded += game.white.score;
                    } else {
                        if (game.color.score < game.white.score) {
                            player.wins++;
                        } else if (game.color.score > game.white.score) {
                            player.losses++;
                        } else if (game.color.score == game.white.score) {
                            player.draws++;
                        }
                        player.team_scored += game.white.score;
                        player.team_conceded += game.color.score;
                    }

                    playerMap.set(playerId, player);
                });
            }
        }

        var result = [];
        playerMap.forEach(function (value, key) {
            // Points
            value.points = value.wins * 3 + value.draws;
            // Wins percentage
            var games_count = value.wins + value.draws + value.losses;

            var winsPers = value.wins / games_count;
            value.winsPers = Math.round(winsPers * 1000) / 1000;

            var team_scored_per_game = value.team_scored / games_count;
            value.team_scored_per_game = Math.round(team_scored_per_game * 10) / 10;

            var team_conceded_per_game = value.team_conceded / games_count;
            value.team_conceded_per_game = Math.round(team_conceded_per_game * 10) / 10;

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

getPlayerList = function (games) {
    var playerSet = new Map();
    for (var gameKey in games) {
        var game = games[gameKey];

        var colorSquadArray = Object.keys(game.color.squad);
        var whiteSquadArray = Object.keys(game.white.squad);

        for (playerId in colorSquadArray) {
            var player = colorSquadArray[playerId]
            playerSet.set(player, player);
        }
        for (playerId in whiteSquadArray) {
            var player = whiteSquadArray[playerId]
            playerSet.set(player, player);
        }
    }
    return playerSet;
}

calculatePlayersRatings = function (games) {
    var playerMap = getPlayerList(games);
    var ratings = [];
    playerMap.forEach(function (value, player) {
        var player_rating = calcPlayerRatingDetail(player, games);

        var points_by_game = [];

        player_rating.games.forEach(function (value) {
            var game_points = {
                points: value.points,
                original_points: value.original_points
            }

            points_by_game.push(game_points);
        });

        ratings.push(
            {
                id: value,
                name: value,
                points_by_game: points_by_game,
                points: player_rating.points,
                progress_place: null,
                progress_point: null
            }
        );
    });
    ratings.sort(function (a, b) {
        return b.points - a.points;
    });

    return ratings;
}

loadRatings = function (response) {
    getLastGames(6, function (games) {
        var curGames = games.slice(0, 5);
        var prevGames = games.slice(1, 6);
        var curRatings = calculatePlayersRatings(curGames);
        var prevRatings = calculatePlayersRatings(prevGames);

        var position = 1;
        curRatings.forEach(function (playerRating) {
            var oldPosition = null;
            var oldPoints = null;
            for (var i = 0; i < prevRatings.length; i++) {
                if (prevRatings[i].id == playerRating.id) {
                    oldPosition = i + 1;
                    oldPoints = prevRatings[i].points;
                    break;
                }
            }

            if (oldPosition != null) {
                playerRating.progress_place = oldPosition - position;
            }
            if (oldPoints != null) {
                playerRating.progress_point = playerRating.points - oldPoints;
            }

            position++;
        });

        response(curRatings);
    });
}

getLastGames = function (count, response) {
    var year = '2017';
    firebase.database.ref(games_brunch + '/' + year).once('value').then(function (snapshot) {
        var games = snapshot.val();
        var gamesIndexArray = Object.keys(games);
        var gamesArray = [];
        var i = 0;
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

        var ar2 = gamesArray.slice(0, count);
        response(ar2);
    });
}

loadRatingsMath = function (player, response) {
    getLastGames(5, function (games) {
        var stat = calcPlayerRatingDetail(player, games);
        response(stat);
    });
}

calcPlayerRatingDetail = function (player, games) {
    const POINTS_FOR_LOSE = 100;
    const POINTS_FOR_WIN = 160;
    const POINTS_FOR_DRAW = 120;
    const POINTS_FOR_GOAL = 10;
    const POINTS_FOR_ASSIST = 10;
    const POINTS_FOR_TEAM_GOAL = 10;
    const POINTS_FOR_TEAM_CONCEDED = 5;
    const FACTOR_4TH_GAME = 0.75;
    const FACTOR_5TH_GAME = 0.5;

    var gamesStat = [];
    var points_summary = 0;
    var game_index = 0;
    for (var gameId in games) {
        var game = games[gameId];

        var gameStat = calcPLayerStatInGame(player, gameId, game);

        var points_for_result = gameStat.wins * POINTS_FOR_WIN + gameStat.draws * POINTS_FOR_DRAW
            + gameStat.losses * POINTS_FOR_LOSE;

        var points = points_for_result +
            gameStat.goals * POINTS_FOR_GOAL +
            gameStat.assists * POINTS_FOR_ASSIST +
            gameStat.team_scored * POINTS_FOR_TEAM_GOAL -
            gameStat.team_conceded * POINTS_FOR_TEAM_CONCEDED;

        var original_points = null;

        if (game_index == 3 && points > 0) {
            original_points = points;
            points = Math.round(points * FACTOR_4TH_GAME);
        }
        if (game_index == 4 && points > 0) {
            original_points = points;
            points = Math.round(points * FACTOR_5TH_GAME);
        }

        points_summary += points;

        gamesStat.push(
            {
                date: game.date,
                title: 'White - Color ' + game.white.score + ':' + game.color.score,
                url: game.id,
                played: true,
                team: gameStat.team,
                win: gameStat.win,
                points_by_cat: [
                    {
                        points: points_for_result
                    },
                    {
                        points: gameStat.goals * POINTS_FOR_GOAL
                    },
                    {
                        points: gameStat.assists * POINTS_FOR_ASSIST
                    },
                    {
                        points: gameStat.team_scored * POINTS_FOR_TEAM_GOAL
                    },
                    {
                        points: gameStat.team_conceded * POINTS_FOR_TEAM_CONCEDED
                    }
                ],
                points: points,
                original_points: original_points
            }
        );
        game_index++;
    }
    var math = {
        rules: {
            points_for_lose : POINTS_FOR_LOSE,
            points_for_draw: POINTS_FOR_DRAW,
            points_for_win: POINTS_FOR_WIN,
            points_for_team_goal: POINTS_FOR_TEAM_GOAL,
            points_for_team_goal_conc: POINTS_FOR_TEAM_CONCEDED,
            points_for_goal: POINTS_FOR_GOAL,
            points_for_assist: POINTS_FOR_ASSIST,
            points_reduction_game_4: 100 - FACTOR_4TH_GAME*100,
            points_reduction_game_5: 100 - FACTOR_5TH_GAME*100
        },
        player: {
            name: player,
            id: player
        },
        points: points_summary,
        games: []
    };
    math.games = gamesStat;
    return math;
}