
// anime_enemies.js
// Anime-themed enemy spawners for n-gon
(function(){
    'use strict';
    
    if(typeof spawn === 'undefined' || typeof mobs === 'undefined' || typeof Matter === 'undefined') {
        console.warn("anime_enemies: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }
    
    const Vector = Matter.Vector;

    // 1. Shadow Stalker - teleporting assassin
    spawn.shadowStalker = function(x, y, radius = 40) {
        mobs.spawn(x, y, 6, radius, "rgba(50,0,80,0.8)");
        let me = mob[mob.length - 1];
        me.stroke = "#000";
        me.memory = 300;
        me.seeAtDistance2 = 1000000;
        me.teleportCD = 0;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            if(this.seePlayer.yes) {
                // Teleport behind player occasionally
                if(this.teleportCD < m.cycle && Math.random() < 0.01) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 150;
                    Matter.Body.setPosition(this, {
                        x: player.position.x + Math.cos(angle) * dist,
                        y: player.position.y + Math.sin(angle) * dist
                    });
                    this.teleportCD = m.cycle + 180;
                    
                    // Teleport effect
                    for(let i = 0; i < 8; i++) {
                        simulation.drawList.push({
                            x: this.position.x + (Math.random() - 0.5) * 80,
                            y: this.position.y + (Math.random() - 0.5) * 80,
                            radius: 15,
                            color: "rgba(100,0,150,0.4)",
                            time: 10
                        });
                    }
                }
                
                // Fast dash toward player
                const angle = Math.atan2(
                    this.seePlayer.position.y - this.position.y,
                    this.seePlayer.position.x - this.position.x
                );
                this.force.x += 0.003 * this.mass * Math.cos(angle);
                this.force.y += 0.003 * this.mass * Math.sin(angle);
            }
            
            this.checkStatus();
        };
    };

    // 2. Crystal Sentinel - defensive turret
    spawn.crystalSentinel = function(x, y, radius = 50) {
        mobs.spawn(x, y, 8, radius, "rgba(100,200,255,0.7)");
        let me = mob[mob.length - 1];
        me.stroke = "#0af";
        me.memory = 600;
        me.seeAtDistance2 = 2000000;
        me.fireCD = 0;
        me.frictionAir = 0.03; // Slow moving
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            // Create shield effect
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(100,200,255,0.3)";
            ctx.lineWidth = 3;
            ctx.stroke();
            
            if(this.seePlayer.yes && this.fireCD < m.cycle) {
                // Fire crystal shard
                const angle = Math.atan2(
                    this.seePlayer.position.y - this.position.y,
                    this.seePlayer.position.x - this.position.x
                );
                
                mobs.bullet(this, angle, 18, 0.015);
                this.fireCD = m.cycle + 60;
            }
            
            this.checkStatus();
        };
    };

    // 3. Plasma Drone - flying shooter
    spawn.plasmaDrone = function(x, y, radius = 30) {
        mobs.spawn(x, y, 4, radius, "rgba(0,255,100,0.7)");
        let me = mob[mob.length - 1];
        me.stroke = "#0f8";
        me.memory = 400;
        me.seeAtDistance2 = 1500000;
        me.fireCD = 0;
        me.frictionAir = 0.02;
        me.g = -0.0003; // Floats
        
        me.do = function() {
            this.force.y += this.mass * this.g;
            this.seePlayerCheck();
            
            // Hover at certain height
            if(this.position.y > this.spawnPos.y - 200) {
                this.force.y -= 0.001 * this.mass;
            }
            
            if(this.seePlayer.yes) {
                // Circle around player
                const toPlayer = Vector.sub(this.seePlayer.position, this.position);
                const dist = Vector.magnitude(toPlayer);
                const perpendicular = { x: -toPlayer.y, y: toPlayer.x };
                const normalized = Vector.normalise(perpendicular);
                
                this.force.x += 0.001 * this.mass * normalized.x;
                this.force.y += 0.001 * this.mass * normalized.y;
                
                // Fire plasma bolts
                if(this.fireCD < m.cycle && dist < 600) {
                    const angle = Math.atan2(toPlayer.y, toPlayer.x);
                    mobs.bullet(this, angle, 15, 0.012);
                    this.fireCD = m.cycle + 45;
                }
            }
            
            this.checkStatus();
        };
    };

    // 4. Void Wraith - phase-shifting entity
    spawn.voidWraith = function(x, y, radius = 45) {
        mobs.spawn(x, y, 5, radius, "rgba(80,0,120,0.6)");
        let me = mob[mob.length - 1];
        me.stroke = "#508";
        me.memory = 500;
        me.seeAtDistance2 = 1800000;
        me.phaseCD = 0;
        me.isPhased = false;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            // Phase in/out
            if(this.phaseCD < m.cycle) {
                this.isPhased = !this.isPhased;
                this.phaseCD = m.cycle + 120;
                
                if(this.isPhased) {
                    this.collisionFilter.category = 0;
                    this.collisionFilter.mask = 0;
                    this.fill = "rgba(80,0,120,0.2)";
                } else {
                    this.collisionFilter.category = cat.mob;
                    this.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet;
                    this.fill = "rgba(80,0,120,0.6)";
                }
            }
            
            if(this.seePlayer.yes) {
                const angle = Math.atan2(
                    this.seePlayer.position.y - this.position.y,
                    this.seePlayer.position.x - this.position.x
                );
                const speed = this.isPhased ? 0.004 : 0.002;
                this.force.x += speed * this.mass * Math.cos(angle);
                this.force.y += speed * this.mass * Math.sin(angle);
            }
            
            this.checkStatus();
        };
    };

    // 5. Thunder Beast - electric AoE
    spawn.thunderBeast = function(x, y, radius = 60) {
        mobs.spawn(x, y, 6, radius, "rgba(255,255,0,0.7)");
        let me = mob[mob.length - 1];
        me.stroke = "#ff0";
        me.memory = 450;
        me.seeAtDistance2 = 1600000;
        me.zapCD = 0;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            // Lightning aura
            if(m.cycle % 20 === 0) {
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255,255,0,0.4)";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            if(this.seePlayer.yes) {
                // Chase player
                const angle = Math.atan2(
                    this.seePlayer.position.y - this.position.y,
                    this.seePlayer.position.x - this.position.x
                );
                this.force.x += 0.0025 * this.mass * Math.cos(angle);
                this.force.y += 0.0025 * this.mass * Math.sin(angle);
                
                // Electric discharge
                const dist = Vector.magnitude(Vector.sub(this.position, player.position));
                if(dist < 250 && this.zapCD < m.cycle) {
                    if(m.immuneCycle < m.cycle) {
                        m.takeDamage(0.02 * this.damageScale());
                    }
                    
                    // Lightning effect
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(player.position.x, player.position.y);
                    ctx.strokeStyle = "#ff0";
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    
                    this.zapCD = m.cycle + 30;
                }
            }
            
            this.checkStatus();
        };
    };

    // Add to spawn pools
    if (typeof spawn !== 'undefined') {
        // Add to tier 2 (medium difficulty)
        if (!spawn.tier[2].includes("shadowStalker")) {
            spawn.tier[2].push("shadowStalker", "crystalSentinel", "plasmaDrone");
        }
        
        // Add to tier 3 (harder)
        if (!spawn.tier[3].includes("voidWraith")) {
            spawn.tier[3].push("voidWraith", "thunderBeast");
        }
        
        // Add to full pick list
        const animeEnemies = ["shadowStalker", "crystalSentinel", "plasmaDrone", "voidWraith", "thunderBeast"];
        animeEnemies.forEach(name => {
            if (!spawn.fullPickList.includes(name)) {
                spawn.fullPickList.push(name);
            }
        });
    }
    
    console.log("%cAnime enemies mod loaded! (5 types)", "color: purple");
})();
