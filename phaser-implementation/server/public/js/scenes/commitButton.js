import { eventsRouter } from '../scenes/eventsRouter.js';
import { PHASER_RENDER_CONFIG} from './renderConfig.js';

// Text objects in Phaser prefer a different format colour 



class CommitButton extends Phaser.GameObjects.Text {
    constructor(scene) {
        super(scene, 250, 50, 'COMMIT', {fill: PHASER_RENDER_CONFIG.text_colours.grey});
        scene.add.existing(this);
        this.setDisplayOrigin(0, 0);
        // Set up the listener 
        eventsRouter.on('node_clicked', this.enableButtonClick, this);
        
    }

    enableButtonClick() {
        // Change colour to blue 
        this.setFill(PHASER_RENDER_CONFIG.text_colours.blue);
        this.setInteractive({ useHandCursor: true})
            .on('pointerdown', () => this.handleButtonClick());
        
    }

    disableButtonClick() {
        // Change colour back to grey 
        this.setFill(PHASER_RENDER_CONFIG.text_colours.blue);
        this.disableInteractive();
    }

    handleButtonClick() {
        eventsRouter.emit('move_confirmed');
    }
}

export { CommitButton };

