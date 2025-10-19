
// Celestial Halberd - Cosmic Hybrid (anime-style)
// Sweeping arc with a solar charge that can be released as a starburst AoE.

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("celestialHalberd: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const CelestialHalberd = {
        name: "celestial halberd",
        descriptionFunction() {
            return `wield a <b style="color:#ffd700">celestial halberd</b> that charges solar energy<br>release a <span style='color:#ff8c00'>starburst AoE</span> when fully charged`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        halberd: null,
        charge: 0,
        maxCharge: 120,
        cycle: 0,
        fire() {},
        do() {
            // charge while not firing (idle stacking)
            if (!input.fire && this.charge < this.maxCharge) {
                this.charge = Math.min(this.maxCharge, this.charge + 0.5);
            }

            // on fire, swing and possibly release starburst
            if (input.fire && !this.halberd && m.fireCDcycle < m.cycle) {
                m.fireCDcycle = m.cycle + 30;
                const pos = m.pos;
                const handle = Bodies.rectangle(pos.x, pos.y, 28, 320, spawn.propsIsNotHoldable);
                const bladeVertices = [
                    { x: -48, y: -80 },
                    { x: 88, y: -200 },
                    { x: -48, y: -240 }
                ];
                const blade = Bodies.fromVertices(pos.x, pos.y - 160, bladeVertices, spawn.propsIsNotHoldable);
                const body = Body.create({ parts: [handle, blade] });
                Composite.add(engine.world, body);
                body.collisionFilter.category = cat.bullet;
                body.collisionFilter.mask = cat.mob | cat.mobBullet | cat.powerup;
                Body.setVelocity(body, { x: Math.cos(m.angle) * 20, y: Math.sin(m.angle) * 20 });
                body._born = m.cycle;
                body._releasedStar = false;
                body._chargeLevel = this.charge;
                this.halberd = body;
                this.cycle = m.cycle;

                // Visual charge effect
                simulation.drawList.push({
                    x: pos.x,
                    y: pos.y,
                    radius: 20 + this.charge * 0.5,
                    color: `rgba(255, 215, 0, ${0.3 + this.charge / 240})`,
                    time: 10
                });
            }

            if (this.halberd) {
                // Draw charge indicator
                if (this.halberd._chargeLevel > 60) {
                    ctx.beginPath();
                    ctx.arc(this.halberd.position.x, this.halberd.position.y, 40 + Math.sin(m.cycle * 0.1) * 10, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 140, 0, ${0.4 + Math.sin(m.cycle * 0.2) * 0.2})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                for (let i = 0; i < mob.length; i++) {
                    if (mob[i].alive && Matter.Query.collides(this.halberd, [mob[i]]).length > 0) {
                        const dmg = 0.18 * m.dmgScale;
                        mob[i].damage(dmg, true);
                        
                        // if enough charge, release a starburst AoE once per swing
                        if (this.halberd._chargeLevel > 60 && !this.halberd._releasedStar) {
                            this.halberd._releasedStar = true;
                            const center = this.halberd.position;
                            const starCount = 8;
                            
                            // spawn multiple star projectiles
                            for (let s = 0; s < starCount; s++) {
                                const a = (s / starCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
                                const speed = 18 + this.halberd._chargeLevel / 8;
                                const starRadius = 14;
                                
                                const star = Bodies.circle(
                                    center.x + Math.cos(a) * 36,
                                    center.y + Math.sin(a) * 36,
                                    starRadius,
                                    spawn.propsIsNotHoldable
                                );
                                
                                Composite.add(engine.world, star);
                                star.collisionFilter.category = cat.bullet;
                                star.collisionFilter.mask = cat.mob | cat.mobBullet | cat.powerup;
                                star.classType = "bullet";
                                star.dmg = 0.12 * m.dmgScale;
                                star.minDmgSpeed = 5;
                                
                                Body.setVelocity(star, {
                                    x: Math.cos(a) * speed,
                                    y: Math.sin(a) * speed
                                });
                                
                                star.endCycle = m.cycle + 120;
                                star.do = function() {
                                    // Star visual trail
                                    simulation.drawList.push({
                                        x: this.position.x,
                                        y: this.position.y,
                                        radius: 8,
                                        color: "rgba(255, 215, 0, 0.6)",
                                        time: 3
                                    });
                                };
                                
                                bullet.push(star);
                            }
                            
                            // visual burst
                            simulation.drawList.push({
                                x: center.x,
                                y: center.y,
                                radius: 80,
                                color: "rgba(255, 140, 0, 0.5)",
                                time: 15
                            });
                            
                            this.charge = 0; // reset charge after burst
                        }
                        break;
                    }
                }

                // cleanup halberd after timeout
                if (m.cycle > this.cycle + 200) {
                    if (this.halberd) {
                        Composite.remove(engine.world, this.halberd);
                        this.halberd = null;
                    }
                }
            }
        }
    };

    b.guns.push(CelestialHalberd);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cCelestial Halberd mod loaded!", "color: #ffd700");
})();
