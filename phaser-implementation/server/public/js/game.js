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



class NodeGraphic extends Phaser.GameObjects.Arc {
  constructor(scene, node_id, x, y, radius, fillColor, fillAlpha) {    
    super(scene, x, y, radius, 0, 360, false, fillColor, fillAlpha);    
    this.node_id = node_id;
    scene.add.existing(this);
    this.setInteractive({ useHandCursor: true})
    .on('pointerdown', () => this.on_node_click() );
  }
  
  get nodeID() {
    return this.node_id;
  }

  on_node_click() {
    eventsRouter.emit('node_clicked', this.node_id);
  }

  // Use events emitters?
  

}

// Rewrite of the MapGraphic class 
class MapGraphic {
  constructor(scene, map_info, player) {
    this.scene = scene;
    this.map = map_info;
    this.player = player;

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

  }

  update_map(move) {

    // Updates the map with a move order issued by server
  }

  handle_node_click(node_id) {
    // Check if a an edge exists
    console.log(node_id);
  }

  propose_move() {
    // Graphically represent the proposed move, and emit a proposed move event
  }

  check_edge_exists(node_1, node_2) {

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