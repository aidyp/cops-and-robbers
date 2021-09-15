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

/* I don't want to hardcode this, would be cool to put it in DynamoDB */

const mapInfo = {
    nodes: [0,1,2,3],
    edges: [(0,1),(1,2),(2,3)],
    positions: {
        0: [0,0],
        1: [0,1],
        2: [1,0],
        3: [1,1]
    }
};

const players = {};

function preload() {
    // Load assets
    this.load.image('ship', 'assets/spaceShips_001.png');
}
function create() {
    const self = this;
    this.players = this.physics.add.group();
    io.on('connection', function (socket) {
        console.log('a user connected');
        players[socket.id] = {
            rotation: 0,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            playerId: socket.id,
            team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
        };
        // Add player to the server
        addPlayer(self, players[socket.id]);
        // Send player object to the new player
        socket.emit('currentPlayers', players);
        // update all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);
        // Send the map 
        socket.emit('newMap', mapInfo);

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
    self.players.add(player);
}

function removePlayer(self, playerId) {
    self.players.getChildren().forEach((player) => {
        if (playerId === player.playerId) {
            player.destroy();
        }
    });
}
const game = new Phaser.Game(config);
window.gameLoaded();