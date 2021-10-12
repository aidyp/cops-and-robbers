import { CommitButton } from '../js/scenes/commitButton.js'
import { eventsRouter } from '../js/scenes/eventsRouter.js'
import { EdgeGraphic, NodeGraphic, PlayerInfo, MapGUI } from './scenes/graphicsObjects.js';
import { PHASER_RENDER_CONFIG } from './scenes/renderConfig.js';

/* Phaser Config setup */
var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: PHASER_RENDER_CONFIG.width,
  height: PHASER_RENDER_CONFIG.height,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};
var game = new Phaser.Game(config);



const PLAYER = {
  COP: 0,
  ROBBER: 1
};




class SocketHandler {
  constructor(socket) {
    this.socket = socket;
    eventsRouter.on('prepare_confirm_move', this.send_move_info, this);
  }

  send_move_info(move) {
    this.socket.emit('move_confirmed', {x: move});
  }

}

class ClientGameController {
  constructor(scene, socket, map_info, player) {
    this.scene = scene; 
    this.mapInfo = map_info;
    this.player = Number(player);
    this.move_state = [];
    this.map_gui = new MapGUI(this.scene, this.mapInfo);
    this.message_container = new PlayerInfo(this.scene, 10, 10, "");

    // Create listeners, and handle them in this game controller 
    eventsRouter.on('node_clicked', this.handle_node_click, this); // Emitted by NodeGraphics
    eventsRouter.on('move_confirmed', this.confirm_move, this); // Emitted by CommitButton

    this.initialise_game();
  }

  initialise_game() {
    this.map_gui.draw_map(this.mapInfo);
    this.display_user_message(`You are player:${this.player}`);
    this.commit_button = new CommitButton(this.scene)

  }


  display_user_message(msg_str) {
    // Set text in the message container

  }

  move_confirmed


}

// Rewrite of the MapGraphic class 
class MapGraphic {
  constructor(scene, map_info, player) {
    this.scene = scene;
    this.map = map_info;
    this.player = Number(player); //Keys are integers at the moment, so cast
    this.move_state = [];

    // Initialise arrays of game objects
    this.node_graphics = [];
    this.edge_graphics = [];

    // Create listeners <-- Clean this up eventually
    eventsRouter.on('node_clicked', this.handle_node_click, this); // Emitted by NodeGraphics
    eventsRouter.on('move_confirmed', this.confirm_move, this); // Emitted by CommitButton

    // Render relevant information to player
    this.print_out_info();
    this.button = new CommitButton(this.scene);
    console.log(this.button);
  }

  print_out_info() {
    var msg_str = "You are player: ".concat(String(this.player));
    console.log(msg_str);
    var text = new PlayerInfo(this.scene, 10, 10, msg_str);
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
      console.log(x, y);
      var circle = new NodeGraphic(this.scene, key, x, y, PHASER_RENDER_CONFIG.node_size, PHASER_RENDER_CONFIG.colours.white, 1);
      this.node_graphics.push(circle);
    }.bind(this));
    

    // Create the edges
    let left, right, x1, y1, x2, y2;
    for (var i = 0; i < this.map.edges.length; i++) {
      var edge = this.map.edges[i];
      [left, right] = edge;
      console.log(left, right);
      [x1, y1] = this.scale_node_position(this.map.positions[left], config.width, config.height);
      [x2, y2] = this.scale_node_position(this.map.positions[right], config.width, config.height);
      console.log(x1, y1, x2, y2);
      // Set the game object to the centre of the screen <-- figure out why!
      var drawn_edge = new EdgeGraphic(this.scene, 
        PHASER_RENDER_CONFIG.image_centre.x, 
        PHASER_RENDER_CONFIG.image_centre.y, 
        x1, 
        y1, 
        x2, 
        y2, 
        PHASER_RENDER_CONFIG.colours.white);
        this.edge_graphics.push(drawn_edge);
    }
    console.log('Finished Drawing Edges');

    console.log('Colouring Nodes');
    this.node_graphics[this.map.characters.cop].setFillStyle(PHASER_RENDER_CONFIG.colours.green, 1);
    this.node_graphics[this.map.characters.robber].setFillStyle(PHASER_RENDER_CONFIG.colours.red, 1);
    this.node_graphics[this.map.characters.honey].setFillStyle(PHASER_RENDER_CONFIG.colours.yellow, 1);


  }

  confirm_move() {

  }

  handle_node_click(node_id) {
    // Check if a an edge exists
    if (this.check_edge_exists(this.player, node_id)) {
      // Create & propose a move
      var proposed_move = [this.player, node_id];
      this.propose_move(proposed_move);
    }
  }

  propose_move(move) {

    // Clear the current move if it exists
    console.log(this.move_state);
    if (this.move_state.length === 1) {
      var old_move = this.move_state[0];
      this.move_state.pop();
      // Get current colour of the node
      var base_colour = this.node_graphics[old_move[1]].fillColor;
      this.node_graphics[old_move[1]].setStrokeStyle(PHASER_RENDER_CONFIG.line_width, base_colour, 1);      
      }
    // Draw the current move 
    this.node_graphics[move[1]].setStrokeStyle(PHASER_RENDER_CONFIG.line_width, PHASER_RENDER_CONFIG.colours.green, 1);
    this.move_state.push(move);
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
  let team;
  
  this.socket.on('currentPlayers', function(players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        displayPlayers(self, players[id], 'ship');
        team = players[id].team;
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
    const network_map = new MapGraphic(self, mapInfo, team);
    network_map.initialise_map();
  })

  this.socket.on('newMove', function (move) {
    network_map.update(move);
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