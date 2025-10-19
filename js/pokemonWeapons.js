
// Pokémon Weapons - 10 Pokémon-inspired weapons
(function() {
    'use strict';
    
    if(typeof b === 'undefined') {
        console.warn("pokemonWeapons: waiting for game...");
        setTimeout(arguments.callee, 100);
        return;
    }

    // 1. Pikachu Thunderbolt
    b.guns.push({
        name: "pikachu thunderbolt",
        descriptionFunction() {
            return `unleash <b style="color:#ffd700">⚡ Thunderbolt</b><br>electric chains between enemies`;
        },
        ammo: 60,
        ammoPack: 20,
        defaultAmmoPack: 20,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 30;
            const range = 600;
            const hitMobs = [];
            
            for(let i = 0; i < mob.length; i++) {
                if(mob[i].alive && Vector.magnitude(Vector.sub(mob[i].position, m.pos)) < range) {
                    hitMobs.push(mob[i]);
                }
            }
            
            hitMobs.forEach(target => {
                target.damage(0.3 * m.dmgScale);
                
                ctx.beginPath();
                ctx.moveTo(m.pos.x, m.pos.y);
                for(let i = 0; i < 8; i++) {
                    ctx.lineTo(
                        m.pos.x + (target.position.x - m.pos.x) * (i / 8) + (Math.random() - 0.5) * 40,
                        m.pos.y + (target.position.y - m.pos.y) * (i / 8) + (Math.random() - 0.5) * 40
                    );
                }
                ctx.lineTo(target.position.x, target.position.y);
                ctx.strokeStyle = "#ffd700";
                ctx.lineWidth = 3;
                ctx.stroke();
            });
        },
        do() {}
    });

    // 2. Charizard Flamethrower
    b.guns.push({
        name: "charizard flamethrower",
        descriptionFunction() {
            return `<b style="color:#ff4500">🔥 Flamethrower</b> stream<br>continuous fire damage`;
        },
        ammo: 100,
        ammoPack: 25,
        defaultAmmoPack: 25,
        have: false,
        fire() {
            if(m.fireCDcycle < m.cycle) {
                const range = 400;
                const angle = m.angle;
                
                for(let i = 0; i < 5; i++) {
                    const dist = 60 + Math.random() * range;
                    const spread = (Math.random() - 0.5) * 0.4;
                    const particle = {
                        x: m.pos.x + Math.cos(angle + spread) * dist,
                        y: m.pos.y + Math.sin(angle + spread) * dist,
                        radius: 15 + Math.random() * 15,
                        cycle: m.cycle + 8
                    };
                    
                    simulation.drawList.push({
                        x: particle.x,
                        y: particle.y,
                        radius: particle.radius,
                        color: `rgba(255, ${69 + Math.random() * 100}, 0, 0.7)`,
                        time: 8
                    });
                    
                    for(let j = 0; j < mob.length; j++) {
                        if(Math.hypot(particle.x - mob[j].position.x, particle.y - mob[j].position.y) < mob[j].radius + particle.radius) {
                            mob[j].damage(0.04 * m.dmgScale);
                            if(typeof mobs.statusDoT === 'function') {
                                mobs.statusDoT(mob[j], 0.015, 90);
                            }
                        }
                    }
                }
                m.fireCDcycle = m.cycle + 3;
            }
        },
        do() {}
    });

    // 3. Blastoise Hydro Pump
    b.guns.push({
        name: "blastoise hydro pump",
        descriptionFunction() {
            return `<b style="color:#1e90ff">💧 Hydro Pump</b><br>powerful water blast with knockback`;
        },
        ammo: 50,
        ammoPack: 15,
        defaultAmmoPack: 15,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 40;
            const angle = m.angle;
            
            for(let i = 0; i < 15; i++) {
                const water = Bodies.circle(
                    m.pos.x + Math.cos(angle) * (30 + i * 8),
                    m.pos.y + Math.sin(angle) * (30 + i * 8),
                    12 + Math.random() * 8,
                    spawn.propsIsNotHoldable
                );
                
                Composite.add(engine.world, water);
                water.collisionFilter.category = cat.bullet;
                water.collisionFilter.mask = cat.mob;
                water.classType = "bullet";
                water.dmg = 0.15 * m.dmgScale;
                water.minDmgSpeed = 5;
                
                const speed = 25 + Math.random() * 5;
                Body.setVelocity(water, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                });
                
                water.endCycle = m.cycle + 60;
                water.beforeDmg = function(who) {
                    who.force.x += Math.cos(angle) * 0.3;
                    who.force.y += Math.sin(angle) * 0.3;
                    this.endCycle = 0;
                };
                
                water.do = function() {
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(30, 144, 255, 0.7)";
                    ctx.fill();
                };
                
                bullet.push(water);
            }
        },
        do() {}
    });

    // 4. Mewtwo Psychic
    b.guns.push({
        name: "mewtwo psychic",
        descriptionFunction() {
            return `<b style="color:#9370db">🧠 Psychic</b> control<br>lift and throw enemies`;
        },
        ammo: 40,
        ammoPack: 10,
        defaultAmmoPack: 10,
        have: false,
        heldEnemy: null,
        fire() {},
        do() {
            if(input.fire && !this.heldEnemy) {
                const range = 300;
                for(let i = 0; i < mob.length; i++) {
                    if(mob[i].alive && Vector.magnitude(Vector.sub(mob[i].position, m.pos)) < range) {
                        this.heldEnemy = mob[i];
                        this.heldEnemy._psychicCycle = m.cycle;
                        break;
                    }
                }
            }
            
            if(this.heldEnemy && input.fire) {
                const targetPos = {
                    x: m.pos.x + Math.cos(m.angle) * 150,
                    y: m.pos.y + Math.sin(m.angle) * 150
                };
                
                this.heldEnemy.force.x = (targetPos.x - this.heldEnemy.position.x) * 0.01;
                this.heldEnemy.force.y = (targetPos.y - this.heldEnemy.position.y) * 0.01;
                
                ctx.beginPath();
                ctx.arc(this.heldEnemy.position.x, this.heldEnemy.position.y, this.heldEnemy.radius + 20, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(147, 112, 219, 0.6)";
                ctx.lineWidth = 4;
                ctx.stroke();
            } else if(this.heldEnemy) {
                const throwForce = Vector.mult(Vector.normalise(Vector.sub(simulation.mouseInGame, this.heldEnemy.position)), 0.4);
                this.heldEnemy.force.x = throwForce.x;
                this.heldEnemy.force.y = throwForce.y;
                this.heldEnemy = null;
                m.fireCDcycle = m.cycle + 30;
            }
        }
    });

    // 5. Gengar Shadow Ball
    b.guns.push({
        name: "gengar shadow ball",
        descriptionFunction() {
            return `<b style="color:#663399">👻 Shadow Ball</b><br>homing dark projectiles`;
        },
        ammo: 70,
        ammoPack: 20,
        defaultAmmoPack: 20,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 25;
            const ball = Bodies.circle(m.pos.x, m.pos.y, 18, spawn.propsIsNotHoldable);
            
            Composite.add(engine.world, ball);
            ball.collisionFilter.category = cat.bullet;
            ball.collisionFilter.mask = cat.mob;
            ball.classType = "bullet";
            ball.dmg = 0.35 * m.dmgScale;
            ball.minDmgSpeed = 5;
            ball._born = m.cycle;
            ball.endCycle = m.cycle + 150;
            
            ball.do = function() {
                let target = null;
                let minDist = Infinity;
                
                for(let i = 0; i < mob.length; i++) {
                    if(mob[i].alive) {
                        const dist = Vector.magnitude(Vector.sub(mob[i].position, this.position));
                        if(dist < minDist) {
                            minDist = dist;
                            target = mob[i];
                        }
                    }
                }
                
                if(target && minDist < 500) {
                    const dir = Vector.normalise(Vector.sub(target.position, this.position));
                    Body.setVelocity(this, Vector.mult(dir, 15));
                }
                
                ctx.save();
                ctx.translate(this.position.x, this.position.y);
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
                grd.addColorStop(0, "rgba(102, 51, 153, 1)");
                grd.addColorStop(1, "rgba(102, 51, 153, 0)");
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            };
            
            bullet.push(ball);
        },
        do() {}
    });

    // 6. Gyarados Hyper Beam
    b.guns.push({
        name: "gyarados hyper beam",
        descriptionFunction() {
            return `<b style="color:#ff0000">💥 Hyper Beam</b><br>devastating laser but must recharge`;
        },
        ammo: 20,
        ammoPack: 5,
        defaultAmmoPack: 5,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 120;
            const range = 1500;
            const start = m.pos;
            const end = {
                x: start.x + Math.cos(m.angle) * range,
                y: start.y + Math.sin(m.angle) * range
            };
            
            const hit = vertexCollision(start, end, [map, mob]);
            const actualEnd = hit.x !== null ? {x: hit.x, y: hit.y} : end;
            
            for(let i = 0; i < mob.length; i++) {
                if(mob[i].alive) {
                    const dist = Math.abs(
                        (actualEnd.y - start.y) * mob[i].position.x -
                        (actualEnd.x - start.x) * mob[i].position.y +
                        actualEnd.x * start.y - actualEnd.y * start.x
                    ) / Math.sqrt((actualEnd.y - start.y) ** 2 + (actualEnd.x - start.x) ** 2);
                    
                    if(dist < mob[i].radius + 25) {
                        mob[i].damage(1.5 * m.dmgScale);
                    }
                }
            }
            
            for(let i = 0; i < 20; i++) {
                const t = i / 19;
                simulation.drawList.push({
                    x: start.x + (actualEnd.x - start.x) * t,
                    y: start.y + (actualEnd.y - start.y) * t,
                    radius: 25 - i,
                    color: "rgba(255, 100, 100, 0.8)",
                    time: 15
                });
            }
        },
        do() {}
    });

    // 7. Snorlax Body Slam
    b.guns.push({
        name: "snorlax body slam",
        descriptionFunction() {
            return `<b style="color:#3d5a80">💤 Body Slam</b><br>ground pound AoE attack`;
        },
        ammo: 30,
        ammoPack: 8,
        defaultAmmoPack: 8,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 80;
            b.explosion(m.pos, 250);
            
            for(let i = 0; i < mob.length; i++) {
                if(mob[i].alive && Vector.magnitude(Vector.sub(mob[i].position, m.pos)) < 250) {
                    if(typeof mobs.statusStun === 'function') {
                        mobs.statusStun(mob[i], 150);
                    }
                }
            }
            
            for(let i = 0; i < 15; i++) {
                simulation.drawList.push({
                    x: m.pos.x + (Math.random() - 0.5) * 300,
                    y: m.pos.y + (Math.random() - 0.5) * 300,
                    radius: 40 + Math.random() * 30,
                    color: "rgba(61, 90, 128, 0.5)",
                    time: 20
                });
            }
        },
        do() {}
    });

    // 8. Articuno Ice Beam
    b.guns.push({
        name: "articuno ice beam",
        descriptionFunction() {
            return `<b style="color:#00bfff">❄️ Ice Beam</b><br>freezing ray that slows`;
        },
        ammo: 80,
        ammoPack: 25,
        defaultAmmoPack: 25,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 18;
            const range = 800;
            const start = m.pos;
            const end = {
                x: start.x + Math.cos(m.angle) * range,
                y: start.y + Math.sin(m.angle) * range
            };
            
            const hit = vertexCollision(start, end, [map, mob]);
            const actualEnd = hit.x !== null ? {x: hit.x, y: hit.y} : end;
            
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(actualEnd.x, actualEnd.y);
            ctx.strokeStyle = "rgba(0, 191, 255, 0.8)";
            ctx.lineWidth = 8;
            ctx.stroke();
            
            for(let i = 0; i < mob.length; i++) {
                if(mob[i].alive) {
                    const dist = Math.abs(
                        (actualEnd.y - start.y) * mob[i].position.x -
                        (actualEnd.x - start.x) * mob[i].position.y +
                        actualEnd.x * start.y - actualEnd.y * start.x
                    ) / Math.sqrt((actualEnd.y - start.y) ** 2 + (actualEnd.x - start.x) ** 2);
                    
                    if(dist < mob[i].radius + 20) {
                        mob[i].damage(0.25 * m.dmgScale);
                        if(typeof mobs.statusSlow === 'function') {
                            mobs.statusSlow(mob[i], 180);
                        }
                    }
                }
            }
        },
        do() {}
    });

    // 9. Dragonite Dragon Rush
    b.guns.push({
        name: "dragonite dragon rush",
        descriptionFunction() {
            return `<b style="color:#ff8c00">🐉 Dragon Rush</b><br>charge through enemies`;
        },
        ammo: 35,
        ammoPack: 10,
        defaultAmmoPack: 10,
        have: false,
        rushing: false,
        fire() {},
        do() {
            if(input.fire && !this.rushing && m.fireCDcycle < m.cycle) {
                this.rushing = true;
                this.rushStart = m.cycle;
                this.rushAngle = m.angle;
                m.fireCDcycle = m.cycle + 60;
                b.guns[b.activeGun].ammo--;
            }
            
            if(this.rushing) {
                const elapsed = m.cycle - this.rushStart;
                if(elapsed < 30) {
                    player.force.x += Math.cos(this.rushAngle) * 0.3;
                    player.force.y += Math.sin(this.rushAngle) * 0.3;
                    
                    simulation.drawList.push({
                        x: m.pos.x,
                        y: m.pos.y,
                        radius: 60,
                        color: "rgba(255, 140, 0, 0.4)",
                        time: 3
                    });
                    
                    for(let i = 0; i < mob.length; i++) {
                        if(mob[i].alive && Vector.magnitude(Vector.sub(mob[i].position, m.pos)) < 100) {
                            mob[i].damage(0.15 * m.dmgScale, true);
                            const angle = Math.atan2(mob[i].position.y - m.pos.y, mob[i].position.x - m.pos.x);
                            mob[i].force.x += Math.cos(angle) * 0.5;
                            mob[i].force.y += Math.sin(angle) * 0.5;
                        }
                    }
                } else {
                    this.rushing = false;
                }
            }
        }
    });

    // 10. Mew Transform
    b.guns.push({
        name: "mew transform",
        descriptionFunction() {
            return `<b style="color:#ff69b4">✨ Transform</b><br>copy random weapon temporarily`;
        },
        ammo: 15,
        ammoPack: 5,
        defaultAmmoPack: 5,
        have: false,
        transformedGun: null,
        fire() {
            if(!this.transformedGun) {
                const availableGuns = b.guns.filter(g => g.have && g.name !== "mew transform");
                if(availableGuns.length > 0) {
                    this.transformedGun = availableGuns[Math.floor(Math.random() * availableGuns.length)];
                    this.transformEnd = m.cycle + 300;
                    simulation.inGameConsole(`<span style='color:#ff69b4'>Transformed into ${this.transformedGun.name}!</span>`);
                }
            } else if(this.transformedGun.fire) {
                this.transformedGun.fire();
            }
        },
        do() {
            if(this.transformedGun) {
                if(m.cycle > this.transformEnd) {
                    this.transformedGun = null;
                } else if(this.transformedGun.do) {
                    this.transformedGun.do();
                }
            }
        }
    });

    console.log("%cPokémon Weapons loaded! (10 weapons)", "color: #ffcb05");
})();
