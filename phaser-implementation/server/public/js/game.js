var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 800,
  height: 600,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
var game = new Phaser.Game(config);
function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
}

function create() {
  var self = this;
  this.socket = io();
  this.players = this.add.group();
  
  this.socket.on('currentPlayers', function(players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], 'ship');
      } else {
        displayPlayers(self, players[id], 'otherPlayer');
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    displayPlayers(self, playerInfo, 'otherPlayer');
  });

  this.socket.on('deletePlayer', function (playerId) {
    self.players.getChildren().forEach(function (player) {
      if (playerId === player.playerId) {
        player.destroy();
      }
    });
  });

  this.socket.on('newMap', function (mapInfo) {
    displayMap(self, mapInfo);
  })
}

function update() {}

function displayPlayers(self, playerInfo, sprite) {
  const player = self.add.sprite(playerInfo.x, playerInfo.y, sprite).setOrigin(0.5, 0.5).setDisplaySize(53, 40);
  if (playerInfo.team === 'blue') player.setTint(0x0000ff);
  else player.setTint(0xff0000);
  player.playerId = playerInfo.playerId;
  self.players.add(player);
}

function displayMap(self, mapInfo) {
  var colour = Phaser.Display.Color.GetColor(0, 255, 0);
  var graphics = self.add.graphics();
  graphics.fillStyle(colour, 1.0);
  graphics.lineStyle(1, colour, 1.0);
  Object.keys(mapInfo.positions).forEach(function(key) {
    var x = mapInfo.positions[key][0];
    var y = mapInfo.positions[key][1];

    var circle = new Phaser.Geom.Circle(x, y, 5);
    graphics.strokeCircleShape(circle);
    graphics.fillCircleShape(circle);
    console.log(circle);
  });
}