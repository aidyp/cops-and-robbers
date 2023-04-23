import { CommitButton } from './scenes/commitButton.js'
import { eventsRouter } from './scenes/eventsRouter.js'
import { StartButton } from './scenes/startButton.js'
import { EdgeGraphic, NodeGraphic, PlayerInfo, MapGUI } from './scenes/graphicsObjects.js';
import { PHASER_RENDER_CONFIG } from './scenes/renderConfig.js';
import { io } from "socket.io-client";

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
    this.game_state = null;
    this.updated = false;
    this.socket = socket
    this.committed = false;
  }

  set_up_listeners() {
    eventsRouter.on('start_button_clicked', this.request_game_start, this);
    eventsRouter.on('server_assigned_role', this.set_role, this);
    eventsRouter.on('server_started_game', this.start_game, this);
    eventsRouter.on('server_updated_game', this.update_game_state, this);
    eventsRouter.on('player_committed_move', this.send_move_to_server, this);
    eventsRouter.on('node_clicked', this.handle_node_click, this);
  }

  set_role(role) {
    if (this.role != null) {return} // Idempotence

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
    if (this.game_state != null) {return} // Idempotence
    this.game_state = game_data; 
    this.map = new MapGUI(this.scene);
    this.map.draw_map(this.game_state);
    this.player_node = (this.role == 0 ? this.game_state.characters.cop : this.game_state.characters.robber);
    this.colour = (this.role == 0 ? PHASER_RENDER_CONFIG.colours.green : PHASER_RENDER_CONFIG.colours.red);
    console.log(this.player_node);
    this.commit_button = new CommitButton(this.scene);
  }

  /**
   * Clientside logic for handling server
   * game update message
   */
  update_game_state(update_data) {
    if (this.updated) {return} // Idempotence
    console.log(update_data);
    this.game_state.characters.robber = update_data.rob
    this.game_state.characters.cop = update_data.cop
    this.updated = true;
    this.player_node = (this.role == 0 ? this.game_state.characters.cop : this.game_state.characters.robber);
    if (update_data.winner == 'cop' || update_data.winner == 'rob') {
      this.handle_end_state(update_data.winner)
      return;
    }
    console.log(this.game_state);
    this.map.draw_map(this.game_state);
    this.committed = false;
  }

  handle_end_state(winner) {
    this.map.draw_map(this.game_state);
    console.log(`${winner} won the game!`);
  }

  /**
   * On a committed move,
   * send it to the server
   */
  send_move_to_server() {
    if (this.committed) {return}
    const client_move_msg = {
      'move': this.proposed_move,
      'player': this.role
    }
    this.socket.emit('proposed_move', client_move_msg);
    this.committed = true;
    this.updated = false;
  }

  handle_node_click(node_id) {
    // Check if the move is 'legal'
    if (!(this._check_edge_exists(this.player_node, node_id))) {return}
    
    this.map.highlight_node(node_id, this.colour);
    this.map.clear_all_nodes_but(node_id);
    this.propose_move(node_id);
  }

  propose_move(node_id) {
    this.proposed_move = [this.player_node, node_id];
  }

  _check_edge_exists(node_1, node_2) {
    for (var i = 0; i < this.game_state.edges.length; i++) {
        var edge = this.game_state.edges[i];
        if (edge.includes(node_1) && edge.includes(node_2)) {
            return true
        }
    }
    return false;
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
    eventsRouter.emit('server_started_game', game_data)
  });
  this.socket.on('updateGame', function(update_data) {
    eventsRouter.emit('server_updated_game', update_data);
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