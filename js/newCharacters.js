
// New Characters Mod - Adds additional mob types to the game
(function() {
    console.log('%cNew Characters mod loading...', 'color: #00ff00');

    // Add new mob types to the spawn system
    const newMobTypes = {
        // Electric Orb - Hovers and shoots electric projectiles
        electricOrb(x, y, radius = 30) {
            mobs.spawn(x, y, 8, radius, "rgba(100, 200, 255, 0.8)");
            let me = mob[mob.length - 1];
            me.tier = 2;
            me.stroke = "rgba(50, 150, 255, 0.9)";
            me.g = 0;
            me.frictionAir = 0.03;
            me.accelMag = 0.0004 * simulation.accelScale;
            me.memory = 180;
            me.seeAtDistance2 = 2000000;
            me.hoverElevation = 200;
            me.fireCD = 0;
            me.fireRate = 120;
            
            me.do = function() {
                this.seePlayerCheck();
                this.checkStatus();
                if (this.seePlayer.recall) {
                    this.healthBar2();
                    this.hoverOverPlayer();
                    
                    // Fire electric bolts
                    if (this.fireCD < simulation.cycle) {
                        this.fireCD = simulation.cycle + this.fireRate;
                        const angle = Math.atan2(m.pos.y - this.position.y, m.pos.x - this.position.x);
                        spawn.bullet(this.position.x, this.position.y, this.tier, 6);
                        const speed = 15;
                        Matter.Body.setVelocity(mob[mob.length - 1], {
                            x: speed * Math.cos(angle),
                            y: speed * Math.sin(angle)
                        });
                    }
                }
                
                // Electric particle effect
                if (!(simulation.cycle % 3)) {
                    ctx.beginPath();
                    ctx.arc(this.position.x + (Math.random() - 0.5) * 50, 
                           this.position.y + (Math.random() - 0.5) * 50, 
                           2, 0, 2 * Math.PI);
                    ctx.fillStyle = "rgba(100, 200, 255, 0.6)";
                    ctx.fill();
                }
            };
        },

        // Crystal Golem - Slow but heavily armored
        crystalGolem(x, y, radius = 45) {
            mobs.spawn(x, y, 6, radius, "rgba(200, 100, 255, 0.7)");
            let me = mob[mob.length - 1];
            me.tier = 3;
            me.stroke = "rgba(150, 50, 200, 0.9)";
            me.damageReduction = 0.3;
            Matter.Body.setDensity(me, 0.003);
            me.accelMag = 0.00015 * simulation.accelScale;
            me.memory = 240;
            me.seeAtDistance2 = 1500000;
            me.frictionAir = 0.02;
            
            me.do = function() {
                this.seePlayerCheck();
                this.checkStatus();
                this.attraction();
                if (this.seePlayer.recall) this.healthBar1();
                
                // Crystal shield visual
                if (!(simulation.cycle % 10)) {
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI * 2 / 6) * i + simulation.cycle * 0.01;
                        const dist = this.radius + 15;
                        ctx.lineTo(
                            this.position.x + Math.cos(angle) * dist,
                            this.position.y + Math.sin(angle) * dist
                        );
                    }
                    ctx.closePath();
                    ctx.strokeStyle = "rgba(200, 100, 255, 0.3)";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            };
        },

        // Shadow Stalker - Fast and teleporting
        shadowStalker(x, y, radius = 25) {
            mobs.spawn(x, y, 5, radius, "rgba(50, 50, 80, 0.6)");
            let me = mob[mob.length - 1];
            me.tier = 2;
            me.stroke = "rgba(30, 30, 60, 0.8)";
            me.accelMag = 0.0006 * simulation.accelScale;
            me.memory = 150;
            me.seeAtDistance2 = 2500000;
            me.blinkRate = 180;
            me.blinkLength = 200;
            
            me.do = function() {
                this.seePlayerCheck();
                this.checkStatus();
                this.attraction();
                this.blink();
                if (this.seePlayer.recall) this.healthBar2();
                
                // Shadow trail effect
                if (this.speed > 5) {
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
                    ctx.fillStyle = "rgba(50, 50, 80, 0.1)";
                    ctx.fill();
                }
            };
        },

        // Flame Spinner - Rotates and shoots fire
        flameSpinner(x, y, radius = 35) {
            mobs.spawn(x, y, 3, radius, "rgba(255, 100, 50, 0.8)");
            let me = mob[mob.length - 1];
            me.tier = 2;
            me.stroke = "rgba(200, 50, 0, 0.9)";
            me.accelMag = 0.0003 * simulation.accelScale;
            me.memory = 200;
            me.seeAtDistance2 = 1800000;
            me.torqueScale = 0.00001;
            
            me.do = function() {
                this.seePlayerCheck();
                this.checkStatus();
                this.attraction();
                if (this.seePlayer.recall) {
                    this.healthBar1();
                    this.torque += this.torqueScale * this.inertia;
                    
                    // Fire trail particles
                    if (!(simulation.cycle % 5)) {
                        for (let i = 0; i < this.vertices.length; i++) {
                            const v = this.vertices[i];
                            ctx.beginPath();
                            ctx.arc(v.x, v.y, 3, 0, 2 * Math.PI);
                            ctx.fillStyle = "rgba(255, 100, 50, 0.5)";
                            ctx.fill();
                        }
                    }
                }
            };
        },

        // Ice Sentinel - Slows nearby enemies
        iceSentinel(x, y, radius = 40) {
            mobs.spawn(x, y, 4, radius, "rgba(150, 200, 255, 0.7)");
            let me = mob[mob.length - 1];
            me.tier = 3;
            me.stroke = "rgba(100, 150, 200, 0.9)";
            me.accelMag = 0.0002 * simulation.accelScale;
            me.memory = 220;
            me.seeAtDistance2 = 1600000;
            me.slowRange = 300;
            
            me.do = function() {
                this.seePlayerCheck();
                this.checkStatus();
                this.attraction();
                if (this.seePlayer.recall) {
                    this.healthBar1();
                    
                    // Slow player if in range
                    const dist = this.distanceToPlayer();
                    if (dist < this.slowRange) {
                        Matter.Body.setVelocity(player, {
                            x: player.velocity.x * 0.95,
                            y: player.velocity.y * 0.95
                        });
                        
                        // Ice aura visual
                        ctx.beginPath();
                        ctx.arc(this.position.x, this.position.y, this.slowRange, 0, 2 * Math.PI);
                        ctx.fillStyle = "rgba(150, 200, 255, 0.05)";
                        ctx.fill();
                    }
                }
            };
        }
    };

    // Add new mob types to spawn object
    Object.assign(spawn, newMobTypes);

    // Add to tier lists for random spawning
    spawn.tier[1].push("electricOrb", "flameSpinner");
    spawn.tier[2].push("shadowStalker", "iceSentinel");
    spawn.tier[3].push("crystalGolem");
    
    // Add to full pick list
    spawn.fullPickList.push(
        "electricOrb", "electricOrb",
        "flameSpinner", "flameSpinner",
        "shadowStalker", "shadowStalker",
        "iceSentinel", "iceSentinel",
        "crystalGolem"
    );

    console.log('%cNew Characters mod loaded! (5 new mob types)', 'color: #00ff00');
})();
