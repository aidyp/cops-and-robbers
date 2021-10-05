import { eventsRouter } from '../scenes/eventsRouter.js'

class CommitButton extends Phaser.GameObjects.Text {
    constructor(scene) {
        super(scene, 250, 50, 'COMMIT', {fill: '#ff0'});
        scene.add.existing(this);
        this.setDisplayOrigin(0, 0);
        // Set up the listener 
        eventsRouter.on('node_clicked', this.enableButtonClick, this);
        
    }

    enableButtonClick() {
        this.setInteractive({ useHandCursor: true})
            .on('pointerdown', () => this.handleButtonClick());
        
    }

    handleButtonClick() {
        eventsRouter.emit('move_confirmed');
    }
}

export { CommitButton };

