// import Phaser from 'phaser';

export default class Planet extends Phaser.GameObjects.Container {
    constructor(scene, x, y, type, id) {
        super(scene, x, y);
        scene.add.existing(this);

        this.id = id;
        this.planetType = type; // 'big', 'medium', 'small'
        this.owner = 0; // 0: Neutral, 1: Player
        this.ships = 0;

        // Config based on type
        const config = {
            big: { radius: 40, capacity: 200, color: 0x888888 },
            medium: { radius: 25, capacity: 50, color: 0x666666 },
            small: { radius: 15, capacity: 20, color: 0x444444 }
        };

        this.stats = config[type];
        this.radius = this.stats.radius;
        this.capacity = this.stats.capacity;

        // Graphics
        this.circle = scene.add.graphics();
        this.add(this.circle);

        // Selection Ring (initially invisible)
        this.selectionRing = scene.add.graphics();
        this.add(this.selectionRing);

        // Text
        this.text = scene.add.text(0, 0, '0', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        this.add(this.text);

        this.draw();
    }

    setOwner(owner) {
        this.owner = owner;
        this.draw();
    }

    addShips(amount) {
        this.ships = Math.min(this.ships + amount, this.capacity);
        this.updateText();
    }

    removeShips(amount) {
        this.ships = Math.max(0, this.ships - amount);
        this.updateText();
    }

    updateText() {
        this.text.setText(Math.floor(this.ships).toString());
    }

    draw() {
        this.circle.clear();

        let color = this.stats.color;
        if (this.owner === 1) color = 0x0000ff; // Player Blue
        if (this.owner === 2) color = 0xff0000; // AI Red
        // if enemy... 

        this.circle.fillStyle(color, 1);
        this.circle.fillCircle(0, 0, this.radius);

        // Neutral/Virgin has white border? Or just grey fill.
        if (this.owner === 0) {
            this.circle.lineStyle(2, 0xaaaaaa);
            this.circle.strokeCircle(0, 0, this.radius);
        }
    }

    toggleSelect(selected) {
        this.selectionRing.clear();
        if (selected) {
            this.selectionRing.lineStyle(4, 0x00ff00, 1); // Thicker line
            this.selectionRing.strokeCircle(0, 0, this.radius + 8); // Larger offset
        }
    }
}
