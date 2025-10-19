
// Raijin Edge - Electric Twin Swords (anime-style)
// Dual swords that create chain lightning between hit enemies; combo counter rewards.

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("raijinEdge: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const RaijinEdge = {
        name: "raijin edge",
        descriptionFunction() {
            return `wield <b style="color:#4169e1">twin lightning swords</b> that chain damage<br>build combo for increased power with <span style='color:#00ffff'>chain lightning</span>`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        blades: [],
        combo: 0,
        lastHitCycle: 0,
        cycle: 0,
        fire() {},
        do() {
            // fire spawns two blades slightly offset
            if (input.fire && this.blades.length === 0 && m.fireCDcycle < m.cycle) {
                m.fireCDcycle = m.cycle + 25;
                const pos = m.pos;
                
                for (let side of [-1, 1]) {
                    const handle = Bodies.rectangle(pos.x + side * 12, pos.y, 12, 120, spawn.propsIsNotHoldable);
                    const bladeVertices = [
                        { x: -4, y: -120 },
                        { x: 4, y: -120 },
                        { x: side * 8, y: -40 }
                    ];
                    const blade = Bodies.fromVertices(pos.x + side * 12, pos.y - 70, bladeVertices, spawn.propsIsNotHoldable);
                    const swordBody = Body.create({ parts: [handle, blade] });
                    
                    Composite.add(engine.world, swordBody);
                    swordBody.collisionFilter.category = cat.bullet;
                    swordBody.collisionFilter.mask = cat.mob | cat.mobBullet | cat.powerup;
                    Body.setVelocity(swordBody, {
                        x: Math.cos(m.angle) * 30,
                        y: Math.sin(m.angle) * 30
                    });
                    swordBody._born = m.cycle;
                    swordBody._side = side;
                    this.blades.push(swordBody);
                }
                this.cycle = m.cycle;
            }

            // Draw combo counter
            if (this.combo > 0) {
                ctx.fillStyle = `rgba(65, 105, 225, ${0.8 - this.combo * 0.02})`;
                ctx.font = "20px Arial";
                ctx.fillText(`⚡ Combo: ${this.combo}x`, m.pos.x - 40, m.pos.y - 80);
            }

            // blades exist: check collisions and chain lightning
            if (this.blades.length > 0) {
                for (let b of this.blades) {
                    // Lightning trail effect
                    if (Composite.allBodies(engine.world).includes(b)) {
                        simulation.drawList.push({
                            x: b.position.x,
                            y: b.position.y,
                            radius: 12,
                            color: "rgba(0, 255, 255, 0.4)",
                            time: 3
                        });
                    }

                    for (let i = 0; i < mob.length; i++) {
                        if (mob[i].alive && Matter.Query.collides(b, [mob[i]]).length > 0) {
                            const hitPower = 0.1 + Math.min(0.25, this.combo * 0.02);
                            mob[i].damage(hitPower * m.dmgScale, true);
                            
                            // chain lightning: find nearby mobs and zap
                            const zapped = [mob[i]];
                            for (let j = 0; j < mob.length; j++) {
                                if (mob[j].alive && mob[j] !== mob[i]) {
                                    const d = Vector.magnitude(Vector.sub(mob[j].position, mob[i].position));
                                    if (d < 220 && Math.random() < 0.9) {
                                        mob[j].damage(0.06 * m.dmgScale, true);
                                        zapped.push(mob[j]);
                                        
                                        // Draw lightning arc
                                        ctx.beginPath();
                                        ctx.moveTo(mob[i].position.x, mob[i].position.y);
                                        ctx.lineTo(mob[j].position.x, mob[j].position.y);
                                        ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
                                        ctx.lineWidth = 2;
                                        ctx.stroke();
                                        
                                        // small knockback
                                        Body.applyForce(mob[j], mob[j].position, {
                                            x: (mob[j].position.x - mob[i].position.x) * 0.0004,
                                            y: (mob[j].position.y - mob[i].position.y) * 0.0004
                                        });
                                    }
                                }
                            }
                            
                            // combo increment and timer
                            this.combo = Math.min(20, this.combo + 1);
                            this.lastHitCycle = m.cycle;
                            
                            // visual lightning effect
                            simulation.drawList.push({
                                x: mob[i].position.x,
                                y: mob[i].position.y,
                                radius: 30 + zapped.length * 10,
                                color: "rgba(65, 105, 225, 0.5)",
                                time: 8
                            });
                            
                            // blades break after a hit
                            Composite.remove(engine.world, b);
                        }
                    }
                }
                
                // remove destroyed blades from array
                this.blades = this.blades.filter(b => Composite.allBodies(engine.world).includes(b));
                
                // combo decay
                if (m.cycle > this.lastHitCycle + 80) this.combo = Math.max(0, this.combo - 1);
                
                // cleanup timeout
                if (m.cycle > this.cycle + 200) {
                    this.blades.forEach(b => Composite.remove(engine.world, b));
                    this.blades = [];
                }
            }
        }
    };

    b.guns.push(RaijinEdge);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cRaijin Edge mod loaded!", "color: #4169e1");
})();
