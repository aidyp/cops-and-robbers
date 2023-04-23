path = require('path');
const jsdom = require('jsdom');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
app.use(express.static('public'));
app.get('/', function (req, res) {
  res.sendFile('index.html');
});
const Datauri = require('datauri/parser');
const datauri = new Datauri();
const { JSDOM } = jsdom;

const mapInfo = {
    nodes: [0,1,2,3,4,5,6,7,8,9,10],
    edges: [[0,1], 
            [1,2],
            [1,3],
            [1,4],
            [2,3],
            [2,4],
            [2,5],
            [3,5],
            [3,7],
            [4,5],
            [4,6],
            [5,6],
            [5,7],
            [5,8],
            [6,8],
            [6,9],
            [7,8],
            [7,9],
            [8,9],
            [9,10]],
    positions: {
        0: [0.1,0.5],
        1: [0.2,0.5],
        2: [0.3, 0.5],
        3: [0.4, 0.4],
        4: [0.4, 0.6],
        5: [0.5, 0.5],
        6: [0.6, 0.6],
        7: [0.6, 0.4],
        8: [0.7, 0.5],
        9: [0.8, 0.5],
        10: [0.9, 0.5]
    },
    characters: {
        cop: 0,
        robber: 10,
        honey: 5
    }
};

const PLAYERS = {
    COP: 0,
    ROB: 1,
    OBS: 2
};

var PLAYER_POSITIONS = {
    cop: mapInfo.characters.cop,
    rob: mapInfo.characters.robber
}

var process = {};


// Required for assigning teams at the moment
var COP_PLAYER_ASSIGNED = false;
var ROB_PLAYER_ASSIGNED = false;
players = {};

io.on('connection', function (socket) {
    console.log('a user connected: ', socket.id);
    // create a new player and add it to our players object
    players[socket.id] = {
      playerId: socket.id,
      role: setTeam(),
      ready: false
    };
    // Emit something on connection event
    socket.emit('assignRole', players[socket.id].role);
    var num_connections = Object.keys(players).length;
    console.log(`Currently ${num_connections} connections`);
    // send the players object to the new player
  
    // when a player disconnects, remove them from our players object
    socket.on('disconnect', function () {
      console.log('user disconnected: ', socket.id);
      freePlayer(players[socket.id])
      delete players[socket.id];
      // emit a message to all players to remove this player
      io.emit('remove', socket.id);
    });

    socket.on('ready', (player) => {
        console.log(`Player ${player} is ready`);
        players[socket.id].ready = true;

        if (serverReady()) {
            console.log("Telling all clients to start the game");
            io.sockets.emit("startGame", mapInfo);
        }
    });

    socket.on('proposed_move', (move) => {
        console.log(socket.id);
        console.log(move);
        if (processMove(socket.id, move)) {
            console.log(process);
            const gameUpdate = process;
            PLAYER_POSITIONS.cop = process.cop;
            PLAYER_POSITIONS.rob = process.rob;
            io.sockets.emit("updateGame", gameUpdate);
            process = {};

        }
        
    });
});

function serverReady() {
    // Server is ready if both players are ready
    var serverReady = true 
    for (var player_key in players) {
        player = players[player_key]
        console.log(player);
        serverReady = serverReady && player.ready
    }
    console.log(`Server is ready: ${serverReady}`);
    return serverReady
}

function addPlayer(self, player){
    // Dirty hack until I fix the object duplication
    player.team = setTeam();
    console.log(`set player team to ${player.team}`);
}

function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
            // Set the flags so that the player can be re-assigned
            console.log(player.team);
            if (player.team === PLAYERS.COP) {COP_PLAYER_ASSIGNED = false;}
            if (player.team === PLAYERS.ROB) {ROB_PLAYER_ASSIGNED = false;}
            player.destroy();
        }
    });
}

function checkPlayers(self) {
    // Get the number of players 
    var num_players = players.length;
    console.log(`Number of players is ${num_players}`);
    return (num_players < 2);
}

function freePlayer(player) {
    if (player.role === PLAYERS.ROB) { ROB_PLAYER_ASSIGNED = false};
    if (player.role === PLAYERS.COP) { COP_PLAYER_ASSIGNED = false};
}

/* Sets the team of the player. Stub for now */
function setTeam(self) {
    if (!(COP_PLAYER_ASSIGNED)) {
        COP_PLAYER_ASSIGNED = true; 
        return PLAYERS.COP;
    }
    if (!(ROB_PLAYER_ASSIGNED)) {
        ROB_PLAYER_ASSIGNED = true;
        return PLAYERS.ROB;
    }
    return PLAYERS.OBS;
    
}
/* Processes the move, emits an event */
function processMove(socket_id, move_data) {
    // Validate the move
    console.log(players[socket_id].role);
    var team = (players[socket_id].role == 0) ? "cop" : "rob";
    var valid = validateMove(team, move_data.move);

    
    // Add the move to this turns process state
    if (valid) {
        // Extract the target node. Luckily for us, it's always the second
        // (TODO, adjust this in case someone is tricky)
        var new_position = move_data.move[1];
        // Push the move if it doesn't already exist
        if (!(team in process)) {
            process[team] = new_position;
        }
    }

    // Check whether or not it's time to emit a new move
    if (Object.keys(process).length === 2) {
        process.winner = 'none'
        if (process.rob == mapInfo.characters.honey) {process.winner = 'rob'}
        if (process.cop == process.rob) {process.winner = 'cop'}
        return true;
    }
    return false;


    

}

function check_edge_exists(node_1, node_2) {
    for (var i = 0; i < mapInfo.edges.length; i++) {
        var edge = mapInfo.edges[i];
        if (edge.includes(node_1) && edge.includes(node_2)) {
            return true
        }
    }
    return false;
}

/* Check whether or not this player can make that move */
function validateMove(player, move) {

    // Check that the edge exists 
    var edge_exists = check_edge_exists(move[0], move[1]);
    
    // Check that the player exists on one of those edges
    var player_node = PLAYER_POSITIONS[player];
    var player_present = move.includes(player_node);

    return (edge_exists && player_present);
    

}

server.listen(8081, function () {
    console.log(`Listening on ${server.address().port}`);
  });