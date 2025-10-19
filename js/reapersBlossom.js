
// Reaper's Blossom - Ethereal Scythe (anime-style)
// On kills, spawns homing petal blades that seek nearest targets.

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("reapersBlossom: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const ReapersBlossom = {
        name: "reaper's blossom",
        descriptionFunction() {
            return `wield a <b style="color:#8b008b">ghostly scythe</b> that bursts<br><span style='color:#ff69b4'>homing petals</span> which seek targets on kill`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        scythe: null,
        petals: [],
        cycle: 0,
        fire() {},
        do() {
            if (input.fire && !this.scythe && m.fireCDcycle < m.cycle) {
                m.fireCDcycle = m.cycle + 35;
                const pos = m.pos;
                const handle = Bodies.rectangle(pos.x, pos.y, 22, 280, spawn.propsIsNotHoldable);
                const bladeVertices = [
                    { x: -30, y: -40 },
                    { x: 60, y: -140 },
                    { x: -30, y: -220 }
                ];
                const blade = Bodies.fromVertices(pos.x, pos.y - 130, bladeVertices, spawn.propsIsNotHoldable);
                const body = Body.create({ parts: [handle, blade] });
                
                Composite.add(engine.world, body);
                body.collisionFilter.category = cat.bullet;
                body.collisionFilter.mask = cat.mob | cat.mobBullet | cat.powerup;
                Body.setVelocity(body, {
                    x: Math.cos(m.angle) * 22,
                    y: Math.sin(m.angle) * 22
                });
                body._born = m.cycle;
                this.scythe = body;
                this.cycle = m.cycle;
            }

            // on collision, damage and sometimes spawn petals
            if (this.scythe) {
                // Ghostly trail
                simulation.drawList.push({
                    x: this.scythe.position.x,
                    y: this.scythe.position.y,
                    radius: 25,
                    color: "rgba(139, 0, 139, 0.3)",
                    time: 4
                });

                for (let i = 0; i < mob.length; i++) {
                    if (mob[i].alive && Matter.Query.collides(this.scythe, [mob[i]]).length > 0) {
                        const wasAlive = mob[i].alive;
                        mob[i].damage(0.14 * m.dmgScale, true);
                        
                        // spawn 4 petals on kill or on strong hits
                        if (!mob[i].alive || Math.random() < 0.22) {
                            for (let p = 0; p < 4; p++) {
                                const petal = Bodies.circle(
                                    this.scythe.position.x + (Math.random() - 0.5) * 20,
                                    this.scythe.position.y + (Math.random() - 0.5) * 20,
                                    8,
                                    spawn.propsIsNotHoldable
                                );
                                
                                Composite.add(engine.world, petal);
                                petal.collisionFilter.category = cat.bullet;
                                petal.collisionFilter.mask = cat.mob | cat.mobBullet | cat.powerup;
                                petal.classType = "bullet";
                                petal.dmg = 0.06 * m.dmgScale;
                                petal.minDmgSpeed = 3;
                                petal._born = m.cycle;
                                petal._life = 160;
                                petal._speed = 6 + Math.random() * 4;
                                
                                petal.do = function() {
                                    // Petal visual
                                    ctx.save();
                                    ctx.translate(this.position.x, this.position.y);
                                    ctx.rotate(m.cycle * 0.1);
                                    ctx.fillStyle = "rgba(255, 105, 180, 0.8)";
                                    ctx.beginPath();
                                    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
                                    ctx.fill();
                                    ctx.restore();
                                };
                                
                                this.petals.push(petal);
                                bullet.push(petal);
                            }
                        }
                        break;
                    }
                }

                // cleanup scythe
                if (m.cycle > this.cycle + 160) {
                    if (this.scythe) {
                        Composite.remove(engine.world, this.scythe);
                        this.scythe = null;
                    }
                }
            }

            // update petals: seek nearest mob
            if (this.petals.length > 0) {
                const survivors = [];
                for (let pet of this.petals) {
                    if (!Composite.allBodies(engine.world).includes(pet)) continue;
                    
                    if (m.cycle - (pet._born || 0) > (pet._life || 160)) {
                        Composite.remove(engine.world, pet);
                        continue;
                    }
                    
                    // find nearest mob
                    let target = null;
                    let best = 1e9;
                    for (let i = 0; i < mob.length; i++) {
                        if (mob[i].alive) {
                            const d = Vector.magnitude(Vector.sub(mob[i].position, pet.position));
                            if (d < best) {
                                best = d;
                                target = mob[i];
                            }
                        }
                    }
                    
                    if (target) {
                        const dir = Vector.normalise(Vector.sub(target.position, pet.position));
                        Body.setVelocity(pet, {
                            x: dir.x * pet._speed,
                            y: dir.y * pet._speed
                        });
                    } else {
                        // drift slowly upward
                        Body.translate(pet, { x: 0, y: -0.4 });
                    }
                    
                    survivors.push(pet);
                }
                this.petals = survivors;
            }
        }
    };

    b.guns.push(ReapersBlossom);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cReaper's Blossom mod loaded!", "color: #8b008b");
})();
