var firebase = require('./firebase');
var async = require('async');

module.exports = {

    loadGame: function(gameId, response) {
        async.series({
            score: function(callback) {
                loadScore(gameId, function(score) {
                    callback(null, score);
                });
            },
            white: function(callback) {
                loadSquad(gameId, true, function(squad) {
                    callback(null, squad);
                });
            },
            color: function(callback) {
                loadSquad(gameId, false, function(squad) {
                    callback(null, squad);
                });
            },
            events: function(callback) {
                loadEvents(gameId, function(squad) {
                    callback(null, squad);
                });
            },
        }, function(err, results) {
            response(results);
        });
    }
};

loadScore = function(gameId, response) {
    firebase.database.ref('/games/' + gameId).once('value').then(function(snapshot) {
        var game = snapshot.val();
        var score = {
            color: game.color.score,
            white: game.white.score
        };
        console.log('Score ', score);

        response(score);
    });
}


loadSquad = function(gameId, white, response) {
    var team = 'color';
    if (white) {
        team = 'white';
    };
    firebase.database.ref('/games/' + gameId + '/' + team+'/squad').once('value').then(function(snapshot) {
        var squad = snapshot.val();
        var dataArray = new Array;
        for(var o in squad) {
            squad[o].name = o;
            dataArray.push(squad[o]);
        }
        console.log('Squad '+team, dataArray);
        response(dataArray);
    });
}


loadEvents = function(gameId, response) {
    firebase.database.ref('/games/' + gameId + '/events').once('value').then(function(snapshot) {
        var events = snapshot.val();
        var dataArray = new Array;
        for(var o in events) {
            dataArray.push(events[o]);
        }
        console.log('Events ', dataArray);
        response(dataArray);
    });
}

loadPlayer = function(playerid, response) {
    firebase.database.ref('/players/' + playerid ).once('value').then(function(snapshot) {
        var player = snapshot.val();
        console.log('Player ', player);
        response(player);
    });
}

asyncLoop = function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function() {
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

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}