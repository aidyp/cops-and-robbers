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

/* Rendering constants for drawing */
var PHASER_RENDER_CONFIG = {
  colours: {
    blue: 0x0000FF,
    green: 0x00FF00,
    yellow: 0xFFFF00,
    red: 0xFF0000,
    white: 0xFFFFFF,
  },
  node_size: 5,
  line_width: 2
};

const PLAYER = {
  COP: 0,
  ROBBER: 1
};

class NetworkMapGUI {
  constructor(map_info, graphics, player) {
    /* Local references for methods */
    this.map = map_info;
    this.graphics = graphics;
    this.player = player;
  }

  // Write a setter for the map_info 
  set map_properties(map_info) {
    this.map = map_info;
  }


  scale_node_position(node_position, width, height) {
    var scaled_positions = [(node_position[0] * width), (node_position[1] * height)];
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
    if (node == this.map.characters.cop) return PHASER_RENDER_CONFIG.colours.green;
    if (node == this.map.characters.robber) return PHASER_RENDER_CONFIG.colours.red; 
    if (node == this.map.characters.honey) return PHASER_RENDER_CONFIG.colours.yellow;
    return PHASER_RENDER_CONFIG.colours.white;
  }

  display_map() {
    /* Draws the current state of the map */
    // Draw the nodes first
    Object.keys(this.map.positions).forEach(function(key) {
      let x, y;
      [x, y] = this.scale_node_position(this.map.positions[key], config.width, config.height);
      var circle = new Phaser.Geom.Circle(x, y, PHASER_RENDER_CONFIG.node_size);  
      var node_colour = this.select_node_colour(key);
      console.log(node_colour);
      this.graphics.fillStyle(node_colour, 1.0)
      this.graphics.lineStyle(1, node_colour, 1.0);
      this.graphics.strokeCircleShape(circle);
      this.graphics.fillCircleShape(circle);
    }.bind(this));   

    // Draw the connection between the nodes.
    this.map.edges.forEach(function (edge) {
      var line_colour = PHASER_RENDER_CONFIG.colours.white;
      console.log(edge);
      let x1, y1, x2, y2;
      [x1, y1] = this.scale_node_position(this.map.positions[edge[0]], config.width, config.height);
      [x2, y2] = this.scale_node_position(this.map.positions[edge[1]], config.width, config.height);
      console.log(x1, y1, x2, y2);
      this.graphics.lineStyle(PHASER_RENDER_CONFIG.line_width, line_colour, 1);
      this.graphics.lineBetween(x1, y1, x2, y2);
    }.bind(this));

    /* TO DO: use the layers feature in Phaser to draw these things */
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
    const network_map = new NetworkMapGUI(mapInfo, graphics);
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