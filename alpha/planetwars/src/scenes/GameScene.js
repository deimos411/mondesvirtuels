// import Phaser from 'phaser'; // Removed for CDN
import Planet from '../objects/Planet.js';
import Fleet from '../objects/Fleet.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.gameOver = false;
        this.planets = [];
        this.fleets = [];
        this.fleets = [];
        this.selectedPlanet = null;

        this.createStars();
        this.createPlanets();

        // Input: Global listener for fuzzy selection
        this.input.on('pointerdown', (pointer) => {
            if (this.gameOver) return;

            let closest = null;
            let minDist = 10000;

            // Find closest planet
            this.planets.forEach(p => {
                const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, p.x, p.y);
                if (dist < p.radius * 2.5) { // Generous 2.5x radius tolerance
                    if (dist < minDist) {
                        minDist = dist;
                        closest = p;
                    }
                }
            });

            if (closest) {
                console.log(`[GAME] Fuzzy Click: Found ${closest.id} at dist ${Math.floor(minDist)}`);
                this.handlePlanetClick(closest);
            } else {
                // Deselect if clicking void?
                if (this.selectedPlanet) {
                    this.selectedPlanet.toggleSelect(false);
                    this.selectedPlanet = null;
                }
            }
        });

        // Production Timer
        this.time.addEvent({
            delay: 1000,
            callback: this.produceShips,
            callbackScope: this,
            loop: true
        });

        // AI Logic Timer
        this.time.addEvent({
            delay: 2000,
            callback: this.updateAI,
            callbackScope: this,
            loop: true
        });

        // Game Over Check Timer
        this.time.addEvent({
            delay: 1000,
            callback: this.checkGameOver,
            callbackScope: this,
            loop: true
        });
    }

    createStars() {
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;
        const graphics = this.add.graphics();

        graphics.fillStyle(0xffffff, 1);

        for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);

            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }
    }

    createPlanets() {
        // 3 Big, 4 Medium, 4 Small
        const types = [
            'big', 'big', 'big',
            'medium', 'medium', 'medium', 'medium',
            'small', 'small', 'small', 'small'
        ];

        // Shuffle types? Or just iterate.
        // Random positions
        const margin = 50;
        const width = this.sys.game.config.width;
        const height = this.sys.game.config.height;

        types.forEach((type, index) => {
            let validPosition = false;
            let x, y;
            let attempts = 0;

            while (!validPosition && attempts < 100) {
                x = Phaser.Math.Between(margin, width - margin);
                y = Phaser.Math.Between(margin, height - margin);
                validPosition = true;

                for (const p of this.planets) {
                    if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < (p.radius + 50 + (type === 'big' ? 40 : 20))) {
                        validPosition = false;
                        break;
                    }
                }
                attempts++;
            }

            const planet = new Planet(this, x, y, type, index);
            this.planets.push(planet);
        });

        // Set Player Start (One of the small planets)
        const smallPlanets = this.planets.filter(p => p.planetType === 'small');
        if (smallPlanets.length > 0) {
            // Player
            const startPlanet = smallPlanets[0];
            startPlanet.setOwner(1);
            startPlanet.ships = 10;
            startPlanet.updateText();

            // AI
            if (smallPlanets.length > 1) {
                const aiPlanet = smallPlanets[1];
                aiPlanet.setOwner(2);
                aiPlanet.ships = 10;
                aiPlanet.updateText();
            }
        }
    }

    handlePlanetClick(planet) {
        if (this.gameOver) return;

        console.log(`[GAME] Planet Clicked: ID=${planet.id}, Owner=${planet.owner}, Ships=${Math.floor(planet.ships)}`);
        if (this.selectedPlanet) {
            console.log('Has selection:', this.selectedPlanet.id);
            if (this.selectedPlanet === planet) {
                // Deselect
                console.log('Deselecting');
                this.selectedPlanet.toggleSelect(false);
                this.selectedPlanet = null;
            } else {
                // Send Fleet
                if (this.selectedPlanet.owner === 1) { // Only send if we own source
                    console.log('Sending fleet');
                    this.sendFleet(this.selectedPlanet, planet);
                    this.selectedPlanet.toggleSelect(false);
                    this.selectedPlanet = null;
                } else {
                    console.log('Clicked invalid target with selection (enemy/neutral source?)'); // Should not happen if we only select owned
                    this.selectedPlanet.toggleSelect(false);
                    if (planet.owner === 1) {
                        this.selectedPlanet = planet;
                        this.selectedPlanet.toggleSelect(true);
                    } else {
                        this.selectedPlanet = null;
                    }
                }
            }
        } else {
            // Select if owned
            console.log('No selection. Owner:', planet.owner);
            if (planet.owner === 1) {
                console.log('Selecting new planet');
                this.selectedPlanet = planet;
                this.selectedPlanet.toggleSelect(true);
            } else {
                console.log('Clicked unowned planet, ignoring');
            }
        }
    }

    sendFleet(source, target) {
        if (source.ships < 1) return;

        const shipsToSend = Math.floor(source.ships);
        source.removeShips(shipsToSend);

        const fleet = new Fleet(this, source, target, shipsToSend);
        this.fleets.push(fleet);
    }

    produceShips() {
        if (this.gameOver) return;

        this.planets.forEach(p => {
            if (p.owner > 0) { // Produce for Player(1) and AI(2)
                p.addShips(2);
            }
        });
    }

    updateAI() {
        if (this.gameOver) return;

        const aiPlanets = this.planets.filter(p => p.owner === 2);

        aiPlanets.forEach(source => {
            if (source.ships > 10) {
                // Find potential targets
                // Priority 1: Weak Neutral Planets (Virgin)
                const neutralTargets = this.planets.filter(p => p.owner === 0);
                // Priority 2: Player Planets
                const playerTargets = this.planets.filter(p => p.owner === 1);

                let target = null;

                // Simple probabilistic decision
                if (neutralTargets.length > 0 && Math.random() < 0.7) {
                    // Attack random neutral
                    target = neutralTargets[Math.floor(Math.random() * neutralTargets.length)];
                } else if (playerTargets.length > 0) {
                    // Attack player
                    target = playerTargets[Math.floor(Math.random() * playerTargets.length)];
                } else if (neutralTargets.length > 0) {
                    target = neutralTargets[Math.floor(Math.random() * neutralTargets.length)];
                }

                if (target) {
                    this.sendFleet(source, target);
                }
            }
        });
    }

    update(time, delta) {
        if (this.gameOver) return;

        // Update Fleets
        for (let i = this.fleets.length - 1; i >= 0; i--) {
            const fleet = this.fleets[i];
            const arrived = fleet.update(time, delta);

            if (arrived) {
                this.handleArrival(fleet);
                fleet.destroy();
                this.fleets.splice(i, 1);
            }
        }
    }

    handleArrival(fleet) {
        const target = fleet.target;

        if (target.owner === fleet.owner) {
            // Reinforce
            target.addShips(fleet.shipCount);
        } else {
            // Attack / Conquest
            if (target.owner === 0) {
                // Virgin/Neutral
                target.setOwner(fleet.owner);
                target.addShips(fleet.shipCount);
            } else {
                // Battle
                if (fleet.shipCount > target.ships) {
                    // Attacker Wins
                    const remaining = fleet.shipCount - target.ships;
                    target.setOwner(fleet.owner);
                    target.ships = remaining;
                    target.updateText();
                } else {
                    // Defender Wins
                    target.removeShips(fleet.shipCount);
                }
            }
        }
    }

    checkGameOver() {
        if (this.gameOver) return;

        const playerPlanets = this.planets.filter(p => p.owner === 1).length;
        const aiPlanets = this.planets.filter(p => p.owner === 2).length;
        // Wait for connection to ensure start
        // Actually, just check if counts are 0, but maybe wait a few seconds at start?
        // Logic: if fleets are in flight, game isn't over.
        // But simplifying: simple domination.

        let result = null;
        if (playerPlanets === 0 && this.fleets.filter(f => f.owner === 1).length === 0) {
            // Player lost all planets and has no fleets
            result = 'DEFEAT';
        } else if (aiPlanets === 0 && this.fleets.filter(f => f.owner === 2).length === 0) {
            // AI lost all planets and has no fleets
            result = 'VICTORY';
        }

        if (result) {
            this.gameOver = true;
            this.showGameOver(result);
        }
    }

    showGameOver(result) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Overlay
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(0, 0, width, height);

        // Text
        const text = result === 'VICTORY' ? 'YOU WIN!' : 'GAME OVER';
        const color = result === 'VICTORY' ? '#00ff00' : '#ff0000';

        this.add.text(width / 2, height / 2 - 50, text, {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: color,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Restart Button
        const restartBtn = this.add.text(width / 2, height / 2 + 50, 'RESTART', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.scene.restart();
            });

        restartBtn.on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#666666' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#444444' }));
    }
}
