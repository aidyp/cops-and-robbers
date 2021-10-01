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
// Create an eventsCenter. Eventually split this up 
const eventsRouter = new Phaser.Events.EventEmitter();
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


// Implementing as a class in case I need to do something later
class EdgeGraphic extends Phaser.GameObjects.Line {
  constructor(scene, x, y, x1, y1, x2, y2, strokeColor) {
    super (scene, x, y, x1, y1, x2, y2, strokeColor);
    scene.add.existing(this);
  }
}

class NodeGraphic extends Phaser.GameObjects.Arc {
  constructor(scene, node_id, x, y, radius, fillColor, fillAlpha) {    
    super(scene, x, y, radius, 0, 360, false, fillColor, fillAlpha);    
    this.node_id = Number(node_id); // For type consistency
    scene.add.existing(this);
    this.setInteractive({ useHandCursor: true})
    .on('pointerdown', () => this.on_node_click() );
  }
  
  on_node_click() {
    eventsRouter.emit('node_clicked', this.node_id);
  }
}

/*
class EdgeGraphic extends Phaser.GameObjects.Line {
  constructor(scene, )
}
*/

// Rewrite of the MapGraphic class 
class MapGraphic {
  constructor(scene, map_info, player) {
    this.scene = scene;
    this.map = map_info;
    this.player = Number(player);
    this.move_state = [];

    // Create listeners <-- Clean this up eventually
    eventsRouter.on('node_clicked', this.handle_node_click, this);
  }

  scale_node_position(node_position, width, height) {
    var scaled_xy = [(node_position[0] * width), (node_position[1] * height)];
    return scaled_xy;
  }
  initialise_map() {
    // Draws the map for the first time. You should only have to do this once
    console.log('Drawing Map');

    // Creates the node objects
    Object.keys(this.map.positions).forEach(function(key) {
      let x, y;
      [x, y] = this.scale_node_position(this.map.positions[key], config.width, config.height);
      var circle = new NodeGraphic(this.scene, key, x, y, PHASER_RENDER_CONFIG.node_size, PHASER_RENDER_CONFIG.colours.white, 1)
    }.bind(this));
    console.log('Finished Drawing Nodes')

    console.log('Drawing Edges');
    let left, right, x1, y1, x2, y2;
    for (var i = 0; i < this.map.edges.length; i++) {
      var edge = this.map.edges[i];
      [left, right] = edge;
      console.log(left, right);
      [x1, y1] = this.scale_node_position(this.map.positions[left], config.width, config.height);
      [x2, y2] = this.scale_node_position(this.map.positions[right], config.width, config.height);
      var drawn_edge = new EdgeGraphic(this.scene, 0.5, 0.5, x1, y1, x2, y2, PHASER_RENDER_CONFIG.colours.white);
    }
    console.log('Finished Drawing Edges');

  }

  update_map(move) {

    // Updates the map with a move order issued by server
  }

  handle_node_click(node_id) {
    // Check if a an edge exists
    if (this.check_edge_exists(this.player, node_id)) {
      // Create & propose a move
      var proposed_move = [this.player, node_id];
      proposed_move(proposed_move);
    }
  }

  propose_move(move) {
    // Graphically represent the proposed move, and emit a proposed move event
    
    // The edge exists due to check_edge_exists() being called before this function
        

  }

  check_edge_exists(node_1, node_2) {

    for (var i = 0; i < this.map.edges.length; i++) {
      var edge = this.map.edges[i];
      if (edge.includes(node_1) && edge.includes(node_2)) {
        return true;
      }
    }
    return false;

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
    const network_map = new MapGraphic(self, mapInfo, 0);
    network_map.initialise_map();
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