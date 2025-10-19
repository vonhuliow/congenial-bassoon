
// Excaliblaze - Flaming Divine Sword (anime-style)
// Charged swing creates crescent flame wave, burn-over-time on hit.

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("excaliblaze: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const Excaliblaze = {
        name: "excaliblaze",
        descriptionFunction() {
            return `wield a <b style="color:#ff4500">flaming divine sword</b><br>hold to charge, release for <span style='color:#ffa500'>flame wave</span> and burn damage`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        sword: null,
        chargeStart: 0,
        charged: false,
        cycle: 0,
        durability: 240,
        maxDurability: 240,
        _flameWaveReleased: false,
        fire() {},
        do() {
            // charge when holding fire
            if (input.fire && !this.sword && !this.charged) {
                if (this.chargeStart === 0) {
                    this.chargeStart = m.cycle;
                }
                
                // Visual charge effect
                const chargeTime = Math.min(60, m.cycle - this.chargeStart);
                if (chargeTime > 0) {
                    simulation.drawList.push({
                        x: m.pos.x,
                        y: m.pos.y,
                        radius: 15 + chargeTime * 0.5,
                        color: `rgba(255, 69, 0, ${0.2 + chargeTime / 120})`,
                        time: 2
                    });
                }
            }
            
            // release / swing
            if (!input.fire && this.chargeStart && !this.sword) {
                const chargeTime = Math.min(60, m.cycle - this.chargeStart);
                const power = 1 + (chargeTime / 60) * 2; // 1x -> 3x
                const pos = m.pos;
                
                // create sword body
                const handle = Bodies.rectangle(pos.x, pos.y, 18, 140, spawn.propsIsNotHoldable);
                const bladeVertices = [
                    { x: -6, y: -140 },
                    { x: 6, y: -140 },
                    { x: 18, y: -40 },
                    { x: -18, y: -40 }
                ];
                const blade = Bodies.fromVertices(pos.x, pos.y - 80, bladeVertices, spawn.propsIsNotHoldable);
                const body = Body.create({ parts: [handle, blade] });
                
                Composite.add(engine.world, body);
                body.collisionFilter.category = cat.bullet;
                body.collisionFilter.mask = cat.mob | cat.mobBullet | cat.powerup;
                
                const speed = 18 + 8 * (chargeTime / 60);
                Body.setVelocity(body, {
                    x: Math.cos(m.angle) * speed,
                    y: Math.sin(m.angle) * speed
                });
                
                body._power = power;
                body._spawnAt = m.cycle;
                this.sword = body;
                this.cycle = m.cycle;
                this.chargeStart = 0;
                this.charged = chargeTime > 28;
                this._flameWaveReleased = false;
                
                m.fireCDcycle = m.cycle + 20;
            }

            // sword exists: apply on-hit effects and flame wave on big charge
            if (this.sword) {
                // Flame trail
                simulation.drawList.push({
                    x: this.sword.position.x,
                    y: this.sword.position.y,
                    radius: 15 * (this.sword._power || 1),
                    color: `rgba(255, 140, 0, ${0.4 * (this.sword._power || 1)})`,
                    time: 5
                });

                for (let i = 0; i < mob.length; i++) {
                    if (mob[i].alive && Matter.Query.collides(this.sword, [mob[i]]).length > 0) {
                        const p = this.sword._power || 1;
                        mob[i].damage(0.12 * p * m.dmgScale, true);
                        
                        // apply burn over time
                        if (typeof mobs.statusDoT === 'function') {
                            mobs.statusDoT(mob[i], 0.01 * p, 80 + 40 * (p - 1));
                        }
                        
                        // on first hit of charged swing, release a crescent flame wave
                        if (this.charged && !this._flameWaveReleased) {
                            this._flameWaveReleased = true;
                            const wave = Bodies.circle(
                                this.sword.position.x + Math.cos(m.angle) * 40,
                                this.sword.position.y + Math.sin(m.angle) * 40,
                                24,
                                spawn.propsIsNotHoldable
                            );
                            
                            Composite.add(engine.world, wave);
                            wave.collisionFilter.category = cat.bullet;
                            wave.collisionFilter.mask = cat.mob | cat.mobBullet | cat.powerup;
                            wave.classType = "bullet";
                            wave.dmg = 0.08 * p * m.dmgScale;
                            wave.minDmgSpeed = 5;
                            
                            const waveSpeed = 28 * p;
                            Body.setVelocity(wave, {
                                x: Math.cos(m.angle) * waveSpeed,
                                y: Math.sin(m.angle) * waveSpeed
                            });
                            
                            wave._born = m.cycle;
                            wave.endCycle = m.cycle + 120;
                            wave._power = p;
                            
                            wave.do = function() {
                                // Flame wave visual
                                simulation.drawList.push({
                                    x: this.position.x,
                                    y: this.position.y,
                                    radius: 30 * (this._power || 1),
                                    color: "rgba(255, 69, 0, 0.6)",
                                    time: 4
                                });
                            };
                            
                            bullet.push(wave);
                        }
                        
                        this.durability -= 4;
                        break;
                    }
                }

                // cleanup sword after timeout or durability depletion
                if (m.cycle > this.cycle + 160 || this.durability <= 0) {
                    if (this.sword) {
                        Composite.remove(engine.world, this.sword);
                        this.sword = null;
                        this._flameWaveReleased = false;
                        this.charged = false;
                        this.durability = this.maxDurability;
                    }
                }
            }
        }
    };

    b.guns.push(Excaliblaze);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cExcaliblaze mod loaded!", "color: #ff4500");
})();
