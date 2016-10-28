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
    var squadRef = firebase.database.ref('/games/' + gameId + '/' + team+'/squad');
    squadRef.on('child_added', function(snapshot) {
        console.log('Squad '+team, snapshot.val());
        response(snapshot.val());
    });
}
