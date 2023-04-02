import { eventsRouter } from '../scenes/eventsRouter.js';

// Text objects in Phaser prefer a different format colour 



class StartButton extends Phaser.GameObjects.Text {
    constructor(scene) {
        super(scene, 350, 350, 'START', {fill: '#00FF00'});
        scene.add.existing(this);
        this.setDisplayOrigin(0, 0);
        this.setInteractive({useHandCursor: true})
            .on('pointerdown', () => this.handleButtonClick())

    }

    handleButtonClick() {
        eventsRouter.emit('start_button_clicked');
    }

    remove() {
        this.destroy(true);
    }
}

export { StartButton };