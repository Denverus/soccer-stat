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
            }
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
        var names = Object.keys(squad);
        console.log('Squad '+team, names);
        response(names);
    });
}
