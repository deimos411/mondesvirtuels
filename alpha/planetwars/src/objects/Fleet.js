// import Phaser from 'phaser';

export default class Fleet extends Phaser.GameObjects.Container {
    constructor(scene, sourcePlanet, targetPlanet, shipCount) {
        super(scene, sourcePlanet.x, sourcePlanet.y);
        scene.add.existing(this);

        this.source = sourcePlanet;
        this.target = targetPlanet;
        this.owner = sourcePlanet.owner; // Store owner at launch time
        this.shipCount = shipCount;
        this.speed = 100; // pixels per second

        console.log('Fleet created with ships:', shipCount, 'from', sourcePlanet.id, 'to', targetPlanet.id, 'Owner:', this.owner);

        // Visuals: A triangle pointing to target
        this.graphics = scene.add.graphics();
        this.add(this.graphics);

        let color = 0x00ffff; // Player Cyan
        if (this.owner === 2) color = 0xff0000; // AI Red

        this.graphics.fillStyle(color, 1);
        this.graphics.fillTriangle(0, -10, 10, 10, -10, 10); // Larger triangle

        // Text count
        this.text = scene.add.text(0, -15, shipCount.toString(), {
            fontSize: '10px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.add(this.text);

        // Rotate to face target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
        this.graphics.rotation = angle + Math.PI / 2;
    }

    update(time, delta) {
        // Move towards target
        const distance = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        if (distance < 5) {
            return true; // Arrived
        }

        const velocity = this.speed * (delta / 1000);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);

        this.x += Math.cos(angle) * velocity;
        this.y += Math.sin(angle) * velocity;

        return false;
    }
}
