var firebase = require('./firebase');
var async = require('async');

module.exports = {

    loadStat: function (response) {
        async.series({
            scorers: function (callback) {
                loadScorers(function (scorers) {
                    callback(null, scorers);
                });
            }
        }, function (err, results) {
            response(results);
        });
    }
};

loadScorers = function (response) {
    firebase.database.ref('/games').once('value').then(function (snapshot) {
        var games = snapshot.val();
        var result = {};

        var gamesIndexArray = Object.keys(games);
        for (var gameKey in gamesIndexArray) {
            var gameId = gamesIndexArray[gameKey];
            var events = games[gameId].events;

            if (events != null) {
                var eventsIndexArray = Object.keys(events);
                for (var eventKey in eventsIndexArray) {
                    var eventId = eventsIndexArray[eventKey];
                    var event = events[eventId];
                    if (result.hasOwnProperty(event.author)) {
                        result[event.author] = result[event.author] + 1;
                    } else {
                        result[event.author] = 1;
                    }
                }
            }
        }

        console.log('Stat ', result);
        response(result);
    });
}