
class CommitButton extends Phaser.GameObjects.Text {
    constructor(scene) {
        super(scene, 250, 50, 'COMMIT', {fill: '#ff0'});
        scene.add.existing(this);
        this.setInteractive({ useHandCursor: true})
            .on('pointerdown', () => this.handleButtonClick());
        this.setDisplayOrigin(0, 0);
    }

    handleButtonClick() {
        console.log('MOVE COMMITED!');
    }
}

export { CommitButton };

