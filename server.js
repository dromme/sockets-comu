var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var players = {};

var tasks = [];

var star = {
    x: Math.floor(Math.random() * 700) + 10,
    y: Math.floor(Math.random() * 500) + 50
};

var comet = {
    x: Math.floor(Math.random() * 700) + 20,
    y: Math.floor(Math.random() * 500) + 20
};

var scores = {
    blue: 100,
    red: 100
};

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('Usuario conectado: ', socket.id);
    socket.on('userCreated', function (name) {
        let team = (Math.floor(Math.random() * 2) === 0) ? 'red' : 'blue';
        console.log('Nuevo jugador del equipo ', team, ' : ', name);
        // create a new player and add it to our players object
        players[socket.id] = {
            name: name,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            playerId: socket.id,
            team: team
        };
        // send the players object to the new player
        socket.emit('currentPlayers', players);

        socket.emit('starLocation', star);
        socket.emit('cometLocation', comet);
        // send the current scores
        socket.emit('scoreUpdate', scores);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);

        // when a player disconnects, remove them from our players object
        socket.on('disconnect', function () {
            console.log('user disconnected: ', socket.id);
            delete players[socket.id];
            // emit a message to all players to remove this player
            io.emit('disconnect', socket.id);
        });

        // when a player moves, update the player data
        socket.on('playerMovement', function (movementData) {
            if(players[socket.id] !== undefined) {
                players[socket.id].x = movementData.x;
                players[socket.id].y = movementData.y;
                // emit a message to all players about the player that moved
                socket.broadcast.emit('playerMoved', players[socket.id]);
            }
        });

        socket.on('starCollected', function () {
            if (players[socket.id].team === 'red') {
                scores.red += 10;
            } else {
                scores.blue += 10;
            }
            star.x = Math.floor(Math.random() * 700) + 50;
            star.y = Math.floor(Math.random() * 500) + 50;
            io.emit('starLocation', star);
            io.emit('scoreUpdate', scores);
        });

        socket.on('cometCollected', function () {
            if (players[socket.id].team === 'red') {
                scores.red -= 10;
            } else {
                scores.blue -= 10;
            }
            comet.x = Math.floor(Math.random() * 700) + 50;
            comet.y = Math.floor(Math.random() * 500) + 50;
            io.emit('cometLocation', comet);
            io.emit('scoreUpdate', scores);
        });
    });
});

server.listen(8080, function () {
    console.log(`Listening on ${server.address().port}`);
});

app.get('/tasks', function (req, res) {
    console.log(tasks);
    res.send(tasks);
});

app.put('/tasks', function (req, res) {
    req.body.id = tasks.length
    tasks.push(req.body);
    console.log(tasks);
    res.send("Tarea guardada");
});

app.delete('/tasks', function (req, res) {
    delete tasks[req.body.id];
    console.log(tasks);
    res.send("Tarea eliminada");
});

app.post('/tasks', function (req, res) {
    tasks[req.body.id] = req.body;
    console.log(tasks);
    res.send("Tarea actualizada");
});
