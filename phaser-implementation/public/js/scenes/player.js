class Player {
    constructor(scene, player_config) {
        // Object for a player
        this.position = player_config.position
        this.type = player_config.type
    }

    getPosition() {
        return this.position
    }

    setPosition(position) {
        this.position = position
    }
}