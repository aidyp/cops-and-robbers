import { eventsRouter } from '../scenes/eventsRouter.js';
import { PHASER_RENDER_CONFIG, alternate_hex_encoding } from './renderConfig.js';

class CommitButton extends Phaser.GameObjects.Text {
    constructor(scene) {
        super(scene, 250, 50, 'COMMIT', {fill: '#ff0'});
        scene.add.existing(this);
        this.setDisplayOrigin(0, 0);
        // Set up the listener 
        eventsRouter.on('node_clicked', this.enableButtonClick, this);
        
    }

    enableButtonClick() {
        // Change colour to blue 
        this.setColor(alternate_hex_encoding(PHASER_RENDER_CONFIG.colours.blue));
        this.setInteractive({ useHandCursor: true})
            .on('pointerdown', () => this.handleButtonClick());
        
    }

    disableButtonClick() {

    }

    handleButtonClick() {
        eventsRouter.emit('move_confirmed');
    }
}

export { CommitButton };

