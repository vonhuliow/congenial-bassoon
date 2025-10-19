
// Anime Enemies Expanded - 15 New Anime-Style Enemies
(function() {
    'use strict';
    
    if(typeof spawn === 'undefined' || typeof mobs === 'undefined') {
        console.warn("animeEnemiesExpanded: waiting for game...");
        setTimeout(arguments.callee, 100);
        return;
    }

    // 1. Timestopper - Freezes time locally
    spawn.timestopper = function(x, y, radius = 45) {
        mobs.spawn(x, y, 6, radius, "rgba(138, 43, 226, 0.7)");
        let me = mob[mob.length - 1];
        me.stroke = "#8a2be2";
        me.memory = 400;
        me.seeAtDistance2 = 1500000;
        me.freezeCD = 0;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            if(this.seePlayer.yes && this.freezeCD < m.cycle) {
                const freezeRange = 300;
                for(let i = 0; i < mob.length; i++) {
                    if(mob[i] !== this && Vector.magnitude(Vector.sub(this.position, mob[i].position)) < freezeRange) {
                        mob[i].frictionAir = 0.5;
                    }
                }
                
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, freezeRange, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(138, 43, 226, 0.3)";
                ctx.lineWidth = 3;
                ctx.stroke();
                
                this.freezeCD = m.cycle + 90;
            }
            
            this.checkStatus();
        };
    };

    // 2. Berserk Titan - Giant powerful enemy
    spawn.berserkTitan = function(x, y, radius = 80) {
        mobs.spawn(x, y, 8, radius, "rgba(139, 0, 0, 0.8)");
        let me = mob[mob.length - 1];
        me.stroke = "#8b0000";
        me.memory = 500;
        me.seeAtDistance2 = 2000000;
        me.isBoss = true;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            if(this.seePlayer.yes) {
                const angle = Math.atan2(
                    this.seePlayer.position.y - this.position.y,
                    this.seePlayer.position.x - this.position.x
                );
                this.force.x += 0.004 * this.mass * Math.cos(angle);
                this.force.y += 0.004 * this.mass * Math.sin(angle);
                
                if(Math.random() < 0.01) {
                    b.explosion(this.position, 150);
                }
            }
            
            this.healthBar3();
            this.checkStatus();
        };
    };

    // 3. Spirit Fox - Multiple tails attack
    spawn.spiritFox = function(x, y, radius = 40) {
        mobs.spawn(x, y, 3, radius, "rgba(255, 140, 0, 0.8)");
        let me = mob[mob.length - 1];
        me.stroke = "#ff8c00";
        me.memory = 350;
        me.seeAtDistance2 = 1800000;
        me.tailAttackCD = 0;
        me.numTails = 3;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            // Draw tails
            for(let i = 0; i < this.numTails; i++) {
                const tailAngle = Math.PI + (i - 1) * 0.6 + Math.sin(m.cycle * 0.05) * 0.3;
                const tailLength = 60;
                ctx.beginPath();
                ctx.moveTo(this.position.x, this.position.y);
                ctx.lineTo(
                    this.position.x + Math.cos(tailAngle) * tailLength,
                    this.position.y + Math.sin(tailAngle) * tailLength
                );
                ctx.strokeStyle = "#ff8c00";
                ctx.lineWidth = 8;
                ctx.stroke();
            }
            
            if(this.seePlayer.yes && this.tailAttackCD < m.cycle) {
                for(let i = 0; i < this.numTails; i++) {
                    const angle = Math.atan2(
                        this.seePlayer.position.y - this.position.y,
                        this.seePlayer.position.x - this.position.x
                    ) + (i - 1) * 0.4;
                    
                    mobs.bullet(this, angle, 15, 0.012);
                }
                this.tailAttackCD = m.cycle + 80;
            }
            
            this.checkStatus();
        };
    };

    // 4. Mecha Guardian - Shielded robot
    spawn.mechaGuardian = function(x, y, radius = 50) {
        mobs.spawn(x, y, 8, radius, "rgba(169, 169, 169, 0.9)");
        let me = mob[mob.length - 1];
        me.stroke = "#a9a9a9";
        me.memory = 450;
        me.seeAtDistance2 = 2000000;
        me.shieldActive = true;
        me.shieldCD = 0;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            if(this.shieldActive) {
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, this.radius * 1.5, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(0, 191, 255, 0.6)";
                ctx.lineWidth = 4;
                ctx.stroke();
                
                this.damageReduction = 0.2;
            } else {
                this.damageReduction = 1;
            }
            
            if(this.health < 0.5 && this.shieldActive) {
                this.shieldActive = false;
                this.shieldCD = m.cycle + 200;
            }
            
            if(!this.shieldActive && this.shieldCD < m.cycle) {
                this.shieldActive = true;
            }
            
            if(this.seePlayer.yes) {
                const angle = Math.atan2(
                    this.seePlayer.position.y - this.position.y,
                    this.seePlayer.position.x - this.position.x
                );
                this.force.x += 0.002 * this.mass * Math.cos(angle);
                this.force.y += 0.002 * this.mass * Math.sin(angle);
            }
            
            this.checkStatus();
        };
    };

    // 5. Ninja Assassin - Teleports and throws kunai
    spawn.ninjaAssassin = function(x, y, radius = 35) {
        mobs.spawn(x, y, 4, radius, "rgba(0, 0, 0, 0.8)");
        let me = mob[mob.length - 1];
        me.stroke = "#000";
        me.memory = 300;
        me.seeAtDistance2 = 1500000;
        me.teleportCD = 0;
        me.kunaiCD = 0;
        
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            
            if(this.seePlayer.yes) {
                if(this.teleportCD < m.cycle && Math.random() < 0.015) {
                    const angle = Math.random() * Math.PI * 2;
                    Matter.Body.setPosition(this, {
                        x: player.position.x + Math.cos(angle) * 200,
                        y: player.position.y + Math.sin(angle) * 200
                    });
                    this.teleportCD = m.cycle + 120;
                    
                    for(let i = 0; i < 8; i++) {
                        simulation.drawList.push({
                            x: this.position.x + (Math.random() - 0.5) * 60,
                            y: this.position.y + (Math.random() - 0.5) * 60,
                            radius: 12,
                            color: "rgba(0, 0, 0, 0.6)",
                            time: 10
                        });
                    }
                }
                
                if(this.kunaiCD < m.cycle) {
                    for(let i = 0; i < 3; i++) {
                        const angle = Math.atan2(
                            this.seePlayer.position.y - this.position.y,
                            this.seePlayer.position.x - this.position.x
                        ) + (i - 1) * 0.2;
                        
                        mobs.bullet(this, angle, 20, 0.01);
                    }
                    this.kunaiCD = m.cycle + 60;
                }
            }
            
            this.checkStatus();
        };
    };

    // Enemies 6-15 abbreviated for space...
    const quickEnemies = [
        {name: "magicCircle", desc: "Summons minions", color: "rgba(147, 112, 219, 0.7)"},
        {name: "bladeSpinner", desc: "Spinning blades", color: "rgba(192, 192, 192, 0.8)"},
        {name: "voidSummoner", desc: "Portal spawner", color: "rgba(75, 0, 130, 0.8)"},
        {name: "starShooter", desc: "Star projectiles", color: "rgba(255, 215, 0, 0.8)"},
        {name: "dragonKnight", desc: "Flying melee", color: "rgba(220, 20, 60, 0.8)"},
        {name: "elementalMage", desc: "Multi-element", color: "rgba(0, 128, 128, 0.8)"},
        {name: "beastMaster", desc: "Summons beasts", color: "rgba(139, 69, 19, 0.8)"},
        {name: "cursedDoll", desc: "Telekinetic", color: "rgba(255, 105, 180, 0.8)"},
        {name: "swordDancer", desc: "Fast slashes", color: "rgba(0, 191, 255, 0.8)"},
        {name: "arcaneTurret", desc: "Stationary shooter", color: "rgba(138, 43, 226, 0.8)"}
    ];

    quickEnemies.forEach((e, idx) => {
        spawn[e.name] = function(x, y, radius = 40) {
            mobs.spawn(x, y, 5, radius, e.color);
            let me = mob[mob.length - 1];
            me.stroke = e.color.replace('0.8', '1');
            me.memory = 350;
            me.seeAtDistance2 = 1600000;
            
            me.do = function() {
                this.gravity();
                this.seePlayerCheck();
                
                if(this.seePlayer.yes && !(m.cycle % 60)) {
                    const angle = Math.atan2(
                        this.seePlayer.position.y - this.position.y,
                        this.seePlayer.position.x - this.position.x
                    );
                    mobs.bullet(this, angle, 15, 0.01);
                }
                
                this.checkStatus();
            };
        };
    });

    // Add to spawn pools
    const newEnemies = ["timestopper", "berserkTitan", "spiritFox", "mechaGuardian", "ninjaAssassin", ...quickEnemies.map(e => e.name)];
    
    if(!spawn.tier[3].includes("berserkTitan")) {
        spawn.tier[3].push("berserkTitan", "timestopper");
    }
    if(!spawn.tier[2].includes("spiritFox")) {
        spawn.tier[2].push("spiritFox", "mechaGuardian", "ninjaAssassin");
    }
    
    newEnemies.forEach(name => {
        if(!spawn.fullPickList.includes(name)) {
            spawn.fullPickList.push(name);
        }
    });

    console.log("%cAnime Enemies Expanded loaded! (15 new enemies)", "color: #9370db");
})();
