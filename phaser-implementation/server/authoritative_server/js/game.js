const config = {
    type: Phaser.HEADLESS,
    parent: 'phaser-example',
    autoFocus: false,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
};

/* I don't want to hardcode this, would be cool to put it in a database */

const mapInfo = {
    nodes: [0,1,2,3],
    edges: [[0,1],[1,2],[2,3]],
    positions: {
        0: [0.1,0.1],
        1: [0.1,0.9],
        2: [0.9,0.1],
        3: [0.9,0.9]
    },
    characters: {
        cop: 0,
        robber: 1,
        honey: 2
    }
};

const PLAYERS = {
    COP: 0,
    ROB: 1
};
// Required for assigning teams at the moment
var COP_PLAYER_ASSIGNED = false;
var ROB_PLAYER_ASSIGNED = false;
players = {};

function preload() {
    // Load assets
    this.load.image('ship', 'assets/spaceShips_001.png');
}



function create() {
    const self = this;
    this.players = this.physics.add.group();
    io.on('connection', function (socket) {
        console.log('a user connected');
        // Check the number of players
        if (checkPlayers(self)) {
            // Create a player object <-- going to cheat here
            players[socket.id] = {
                rotation: 0,
                x: 0,
                y: 0,
                playerId: socket.id,
                team: 0
            };

            // Add player to the server
            addPlayer(self, players[socket.id]);
            // Send players object to the new player
            socket.emit('currentPlayers', players);
            // update all other players of the new player
            socket.broadcast.emit('newPlayer', players[socket.id]);
            // Send the map 
            socket.emit('newMap', mapInfo);            
        }

    
        // Disconnection event
        socket.on('disconnect', function () {
            console.log('user disconnected');
            removePlayer(self, socket.id);
            delete players[socket.id];
            // emit a message to trigger removal
            socket.broadcast.emit('deletePlayer', socket.id);
        });
        // Create a player object


    });

}
function update() {}
function addPlayer(self, playerInfo){
    const player = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    player.setDrag(100);
    player.setAngularDrag(100);
    player.setMaxVelocity(200);
    player.playerId = playerInfo.playerId;

    // Set the team here
    player.team = setTeam();
    // Dirty hack until I fix the object duplication
    playerInfo.team = player.team;
    self.players.add(player);
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
    var num_players = self.players.getChildren().length;
    return (num_players < 2);
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
    
}
const game = new Phaser.Game(config);
window.gameLoaded();