import { eventsRouter } from "./eventsRouter.js";

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
    line_width: 2,
    image_centre: {
      x: 0,
      y: 0
    },
    width: 800,
    height: 600
};

class EdgeGraphic extends Phaser.GameObjects.Line {
    constructor(scene, x, y, x1, y1, x2, y2, strokeColor) {
      super (scene, x, y, x1, y1, x2, y2, strokeColor);
      scene.add.existing(this);
      this.setDisplayOrigin(0, 0); //Set the origin here to make it work, no idea why
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

class MapGUI {
    constructor(scene, mapInfo) {
        this.scene = scene 
        this.mapInfo = mapInfo
        this.node_graphics = [];
        this.edge_graphics = [];
    }

    scale_node_position(node_position, width, height) {
        var scaled_xy = [(node_position[0] * width), (node_position[1]* height)];
        return scaled_xy;
    }

    draw_map() {
        // Draw the edges, then the nodes 

        let left, right, x1, y1, x2, y2;
        for (var i = 0; i < this.mapInfo.edges.length; i++) {
            var edge = this.mapInfo.edges[i];
            [left, right] = edge;
            [x1, y1] = this.scale_node_position(this.mapInfo.positions[left], PHASER_RENDER_CONFIG.width, PHASER_RENDER_CONFIG.height);
            [x2, y2] = this.scale_node_position(this.mapInfo.positions[right], PHASER_RENDER_CONFIG.width, PHASER_RENDER_CONFIG.height);
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

        let x, y; 
        for (var i = 0; i < this.mapInfo.positions.length; i++) {
            [x, y] = this.scale_node_position(this.mapInfo.positions[i], PHASER_RENDER_CONFIG.width, PHASER_RENDER_CONFIG.height);
            var circle = new NodeGraphic(this.scene, i, x, y, PHASER_RENDER_CONFIG.node_size, PHASER_RENDER_CONFIG.colours.white, 1);
            this.node_graphics.push(circle);
        }

        // Colour occupied nodes
        this.node_graphics[this.mapInfo.characters.robber].setFillStyle(PHASER_RENDER_CONFIG.colours.red, 1);
        this.node_graphics[this.mapInfo.characters.honey].setFillStyle(PHASER_RENDER_CONFIG.colours.yellow, 1);
        this.node_graphics[this.mapInfo.characters.cop].setFillStyle(PHASER_RENDER_CONFIG.colours.green, 1);



    }

    highlight_node(node, colour) {
        this.node_graphics[node].setStrokeStyle(PHASER_RENDER_CONFIG.line_width, colour, 1);
    }

    clear_highlighted_node(node) {
        var base_colour = this.node_graphics[node].fillColor;
        this.node_graphics[node].setStrokeStyle(PHASER_RENDER_CONFIG.line_width, base_colour, 1);
    }
}

export {PHASER_RENDER_CONFIG, EdgeGraphic, NodeGraphic};

