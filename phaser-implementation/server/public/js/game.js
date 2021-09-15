/* Phaser Config setup */
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

var phaser_render_config = {
  colours: {
    blue: 0x0000FF,
    green: 0x00FF00,
    yellow: 0xFFFF00,
    white: 0xFFFFFF,
  },
  node_size: 5
};

class NetworkMapGUI {
  constructor(map_info, render_config, graphics) {
    this.map = map_info;
    this.graphics = graphics;
    this.render_config = render_config;
    this.cop = 0;
    this.robber = 3;
    this.honey = 2;
  }

  scale_node_position(node_position, width, height) {
    var scaled_positions = [(node_position[0] + width) / 2, (node_position[1] + height) / 2];
    return scaled_positions;
  }

  scale_positions() {
    /* Scales the 1x1 box to the screen size */ 
    Object.keys(this.map.positions).forEach(function(key) {
      this.map.positions[key] = this.scale_node_position(this.map.positions[key], config.width, config.height);
    }.bind(this));
  }

  select_node_colour(node) {
    /* Selects node colour based on node type */
    if (node === this.robber) return phaser_render_config.colours.green;
    if (node === this.cop) return phaser_render_config.colours.red; 
    if (node === this.honey) return phaser_render_config.colours.yellow;
    return phaser_render_config.colours.white;
  }

  display_map() {
    /* Draws the current state of the map */
    // Draw the nodes first
    Object.keys(this.map.positions).forEach(function(key) {
      let x, y;
      [x, y] = this.scale_node_position(this.map.positions[key], config.width, config.height);
      var circle = new Phaser.Geom.Circle(x, y, this.render_config.node_size);  
      var node_colour = this.select_node_colour(key);
      this.graphics.fillStyle(node_colour, 1.0)
      this.graphics.lineStyle(1, node_colour, 1.0);
      this.graphics.strokeCircleShape(circle);
      this.graphics.fillCircleShape(circle);
    }.bind(this));   
  }
}




function preload() {
  this.load.image('ship', 'assets/spaceShips_001.png');
  this.load.image('otherPlayer', 'assets/enemyBlack5.png');
}

function create() {
  var self = this;
  var graphics = this.add.graphics();
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
    const network_map = new NetworkMapGUI(mapInfo, phaser_render_config, graphics);
    network_map.display_map();
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