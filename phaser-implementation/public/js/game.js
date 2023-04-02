import { CommitButton } from './scenes/commitButton.js'
import { eventsRouter } from './scenes/eventsRouter.js'
import { StartButton } from './scenes/startButton.js'
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

class GameController {
  constructor(scene, socket) {
    this.scene = scene;
    this.set_up_listeners();
    this.role = null;
    this.map = null;
    this.socket = socket
  }

  set_up_listeners() {
    eventsRouter.on('start_button_clicked', this.request_game_start, this);
    eventsRouter.on('server_assigned_role', this.set_role, this);
    eventsRouter.on('server_started_game', this.start_game, this);
  }

  set_role(role) {
    if (this.role != null) {return} // for idempotence

    console.log(`Assigned ${role} role`);
    console.log("Setting role");
    this.role = role 
    this.player_info = new PlayerInfo(this.scene, 10, 10, "You are player " + role)
    this.start_button = new StartButton(this.scene);
  }

  request_game_start() {
    eventsRouter.emit('ready_to_start', this.role);
    console.log("Ready to begin");
    this.start_button.remove();
    console.log("Destroyed button");
    console.log("Sending data to server");
    this.socket.emit("ready", this.role);
  }

  /**
   * Creates a new game for the client
   */
  start_game(game_data) {
    if (this.map != null) {return} // Idempotence
    this.map = new MapGUI(this.scene);
    this.map.draw_map(game_data);

  }
  /**
   * Clientside logic for handling server
   * game update message
   */
  update_game_state() {
  }

}



function preload() {}
function create() {
  var self = this;
  this.socket = io();
  this.controller = new GameController(self, this.socket)
}
function update() {
  this.socket.on('assignRole', (role) => {
    eventsRouter.emit('server_assigned_role', role) 
  });
  this.socket.on('startGame', function(game_data) {
    console.log("Starting the game");
    eventsRouter.emit('server_started_game', game_data)
  });
  this.socket.on('updateGame', function(game_data) {
    console.log("Updating the game");
  })
}



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


}

// Rewrite of the MapGraphic class 
class MapGraphic {
  constructor(scene, map_info, player) {
    this.scene = scene;
    this.map = map_info;
    this.player = Number(player); // Need to convert between TEAM and PLAYER
    this.move_state = [];

    // Initialise arrays of game objects
    this.node_graphics = [];
    this.edge_graphics = [];

    // Create listeners <-- Clean this up eventually
    eventsRouter.on('node_clicked', this.handle_node_click, this); // Emitted by NodeGraphics
    eventsRouter.on('move_confirmed', this.confirm_move, this); // Emitted by CommitButton

    // Render relevant information to player
    this.print_out_info();
    this.game_title = new PlayerInfo(this.scene, 100, 50, "network_defender", {fontFamily: 'Courier', fontSize: '64px'});
    this.button = new CommitButton(this.scene);
    console.log(this.button);
  }

  print_out_info() {
    var msg_str = "You are player: ".concat(String(this.player));
    console.log(msg_str);
    var text = new PlayerInfo(this.scene, 10, 10, msg_str);
  }
}