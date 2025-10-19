
// anime_guns.js
// 10 anime-style guns (projectiles, beams, charge, AoE).
// Compatible with n-gon's bullet system
(function(){
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined' || typeof bullet === 'undefined') {
        console.warn("anime_guns: required globals missing (b, Bodies, Composite, bullet). Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const pushVFX = (x, y, r, color, life = 30) => {
        if(simulation && simulation.drawList) {
            simulation.drawList.push({x, y, radius: r, color, time: life});
        }
    };

    const spawnProjectile = (x, y, angle, speed, radius, opts = {}) => {
        const id = bullet.length;
        bullet[id] = Bodies.circle(x, y, radius || 6, {
            density: 0.001,
            friction: 0.5,
            frictionAir: 0,
            restitution: 0,
        });
        bullet[id].customName = opts.name || "anime_proj";
        bullet[id].dmg = opts.dmg || 1;
        bullet[id].minDmgSpeed = opts.minDmgSpeed || 2;
        bullet[id].classType = "bullet";
        bullet[id].collisionFilter = {
            category: (typeof cat !== 'undefined' && cat.bullet) || 0x0004,
            mask: (typeof cat !== 'undefined') ? (cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield) : 0xFFFF
        };
        Matter.Body.setVelocity(bullet[id], { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
        if(typeof opts.ttl === "number") bullet[id].endCycle = simulation.cycle + opts.ttl;
        bullet[id].beforeDmg = opts.beforeDmg || function() {};
        bullet[id].onEnd = opts.onEnd || function() {};
        bullet[id].do = opts.do || function() {};
        Composite.add(engine.world, bullet[id]);
        return id;
    };

    // 1. Spirit Rifle - rapid fire energy bolts
    b.guns.push({
        name: "spirit rifle",
        descriptionFunction() {
            return `rapid-fire <b style="color:#4af">spirit bolts</b><br>high rate of fire, medium damage`;
        },
        ammo: 180,
        ammoPack: 45,
        defaultAmmoPack: 45,
        have: false,
        fire() {
            const angle = m.angle;
            const speed = 25;
            m.fireCDcycle = m.cycle + 3;
            
            spawnProjectile(
                m.pos.x + 30 * Math.cos(angle),
                m.pos.y + 30 * Math.sin(angle),
                angle, speed, 4,
                {
                    name: "spirit_bolt",
                    dmg: 0.3,
                    ttl: 90,
                    do() {
                        pushVFX(this.position.x, this.position.y, 8, "rgba(70,170,255,0.3)", 3);
                    }
                }
            );
            pushVFX(m.pos.x + 20 * Math.cos(angle), m.pos.y + 20 * Math.sin(angle), 15, "#4af", 5);
        },
        do() {}
    });

    // 2. Mana Cannon - charged shots
    b.guns.push({
        name: "mana cannon",
        descriptionFunction() {
            return `charge and release <b style="color:#f4a">mana blasts</b><br>longer charge = more damage`;
        },
        ammo: 50,
        ammoPack: 12,
        defaultAmmoPack: 12,
        have: false,
        charge: 0,
        fire() {
            if(input.fire) {
                this.charge = Math.min(this.charge + 1, 120);
            }
        },
        do() {
            if(this.charge > 0 && !input.fire) {
                const angle = m.angle;
                const dmg = 0.5 + this.charge * 0.02;
                const radius = 8 + this.charge * 0.1;
                
                spawnProjectile(
                    m.pos.x + 40 * Math.cos(angle),
                    m.pos.y + 40 * Math.sin(angle),
                    angle, 20, radius,
                    {
                        name: "mana_blast",
                        dmg: dmg,
                        ttl: 150,
                        do() {
                            pushVFX(this.position.x, this.position.y, this.radius * 1.5, "rgba(255,70,170,0.2)", 4);
                        },
                        onEnd() {
                            if(this.endCycle === simulation.cycle) {
                                b.explosion(this.position, 50 + this.radius * 5);
                            }
                        }
                    }
                );
                
                pushVFX(m.pos.x + 30 * Math.cos(angle), m.pos.y + 30 * Math.sin(angle), 30, "#f4a", 8);
                m.fireCDcycle = m.cycle + 30;
                this.charge = 0;
                b.guns[b.activeGun].ammo--;
                simulation.updateGunHUD();
            }
        }
    });

    // 3. Lightning Lance - piercing beam
    b.guns.push({
        name: "lightning lance",
        descriptionFunction() {
            return `piercing <b style="color:#ff0">lightning beam</b><br>hits multiple enemies in a line`;
        },
        ammo: 60,
        ammoPack: 15,
        defaultAmmoPack: 15,
        have: false,
        fire() {
            const angle = m.angle;
            m.fireCDcycle = m.cycle + 25;
            
            const range = 1200;
            const start = { x: m.pos.x + 30 * Math.cos(angle), y: m.pos.y + 30 * Math.sin(angle) };
            const end = { x: start.x + range * Math.cos(angle), y: start.y + range * Math.sin(angle) };
            
            const hit = vertexCollision(start, end, [map, mob, body]);
            const actualEnd = hit.x !== null ? { x: hit.x, y: hit.y } : end;
            
            // Visual beam
            for(let i = 0; i < 8; i++) {
                const t = i / 7;
                pushVFX(
                    start.x + (actualEnd.x - start.x) * t,
                    start.y + (actualEnd.y - start.y) * t,
                    12 - i, "rgba(255,255,0,0.6)", 6
                );
            }
            
            // Damage mobs along the line
            for(let i = 0; i < mob.length; i++) {
                if(mob[i].alive) {
                    const dist = Math.abs(
                        (actualEnd.y - start.y) * mob[i].position.x -
                        (actualEnd.x - start.x) * mob[i].position.y +
                        actualEnd.x * start.y - actualEnd.y * start.x
                    ) / Math.sqrt(Math.pow(actualEnd.y - start.y, 2) + Math.pow(actualEnd.x - start.x, 2));
                    
                    if(dist < mob[i].radius + 15) {
                        mob[i].damage(1.2);
                        pushVFX(mob[i].position.x, mob[i].position.y, mob[i].radius, "rgba(255,255,0,0.4)", 8);
                    }
                }
            }
        },
        do() {}
    });

    // 4. Frost Shard - ice projectiles that slow
    b.guns.push({
        name: "frost shard",
        descriptionFunction() {
            return `shoots <b style="color:#0cf">ice shards</b> that slow enemies<br>chills targets on hit`;
        },
        ammo: 90,
        ammoPack: 22,
        defaultAmmoPack: 22,
        have: false,
        fire() {
            const angle = m.angle;
            m.fireCDcycle = m.cycle + 12;
            
            spawnProjectile(
                m.pos.x + 30 * Math.cos(angle),
                m.pos.y + 30 * Math.sin(angle),
                angle, 22, 5,
                {
                    name: "frost_shard",
                    dmg: 0.4,
                    ttl: 100,
                    beforeDmg(who) {
                        if(typeof mobs !== 'undefined' && mobs.statusSlow) {
                            mobs.statusSlow(who, 90);
                        }
                        this.endCycle = 0;
                    },
                    do() {
                        pushVFX(this.position.x, this.position.y, 6, "rgba(0,200,255,0.4)", 3);
                    }
                }
            );
            pushVFX(m.pos.x + 20 * Math.cos(angle), m.pos.y + 20 * Math.sin(angle), 12, "#0cf", 4);
        },
        do() {}
    });

    // 5. Void Blaster - dark energy AoE
    b.guns.push({
        name: "void blaster",
        descriptionFunction() {
            return `fires <b style="color:#808">void spheres</b><br>explodes on impact with dark energy`;
        },
        ammo: 40,
        ammoPack: 10,
        defaultAmmoPack: 10,
        have: false,
        fire() {
            const angle = m.angle;
            m.fireCDcycle = m.cycle + 35;
            
            spawnProjectile(
                m.pos.x + 35 * Math.cos(angle),
                m.pos.y + 35 * Math.sin(angle),
                angle, 18, 10,
                {
                    name: "void_sphere",
                    dmg: 0.6,
                    ttl: 120,
                    do() {
                        pushVFX(this.position.x, this.position.y, 14, "rgba(100,0,100,0.3)", 4);
                    },
                    onEnd() {
                        if(this.endCycle === simulation.cycle) {
                            b.explosion(this.position, 180);
                            for(let i = 0; i < 5; i++) {
                                pushVFX(
                                    this.position.x + (Math.random() - 0.5) * 60,
                                    this.position.y + (Math.random() - 0.5) * 60,
                                    30 + Math.random() * 20, "rgba(100,0,100,0.4)", 12
                                );
                            }
                        }
                    }
                }
            );
            pushVFX(m.pos.x + 25 * Math.cos(angle), m.pos.y + 25 * Math.sin(angle), 25, "#808", 6);
        },
        do() {}
    });

    // 6. Plasma Repeater - fast triple shot
    b.guns.push({
        name: "plasma repeater",
        descriptionFunction() {
            return `triple-shot <b style="color:#0f0">plasma bursts</b><br>fires 3 bolts in a spread`;
        },
        ammo: 120,
        ammoPack: 30,
        defaultAmmoPack: 30,
        have: false,
        fire() {
            const baseAngle = m.angle;
            m.fireCDcycle = m.cycle + 15;
            
            for(let i = -1; i <= 1; i++) {
                const angle = baseAngle + i * 0.15;
                spawnProjectile(
                    m.pos.x + 28 * Math.cos(angle),
                    m.pos.y + 28 * Math.sin(angle),
                    angle, 23, 4,
                    {
                        name: "plasma_bolt",
                        dmg: 0.25,
                        ttl: 85,
                        do() {
                            pushVFX(this.position.x, this.position.y, 7, "rgba(0,255,0,0.3)", 3);
                        }
                    }
                );
            }
            pushVFX(m.pos.x + 20 * Math.cos(baseAngle), m.pos.y + 20 * Math.sin(baseAngle), 18, "#0f0", 5);
        },
        do() {}
    });

    // 7. Photon Rifle - precision laser
    b.guns.push({
        name: "photon rifle",
        descriptionFunction() {
            return `fires precise <b style="color:#fff">photon beams</b><br>instant hit, high accuracy`;
        },
        ammo: 70,
        ammoPack: 18,
        defaultAmmoPack: 18,
        have: false,
        fire() {
            const angle = m.angle;
            m.fireCDcycle = m.cycle + 20;
            
            const range = 1500;
            const start = { x: m.pos.x + 35 * Math.cos(angle), y: m.pos.y + 35 * Math.sin(angle) };
            const end = { x: start.x + range * Math.cos(angle), y: start.y + range * Math.sin(angle) };
            
            const hit = vertexCollision(start, end, [map, mob, body]);
            const actualEnd = hit.x !== null ? { x: hit.x, y: hit.y } : end;
            
            // Draw beam
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(actualEnd.x, actualEnd.y);
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
            
            // Damage on hit
            if(hit.who && hit.who.alive) {
                hit.who.damage(1.5);
                pushVFX(actualEnd.x, actualEnd.y, 25, "rgba(255,255,255,0.6)", 10);
            }
            
            pushVFX(start.x, start.y, 20, "#fff", 6);
        },
        do() {}
    });

    // 8. Chaos Scatter - random spread
    b.guns.push({
        name: "chaos scatter",
        descriptionFunction() {
            return `unleashes <b style="color:#f80">chaotic energy</b><br>fires random projectiles in all directions`;
        },
        ammo: 80,
        ammoPack: 20,
        defaultAmmoPack: 20,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 18;
            const count = 5 + Math.floor(Math.random() * 3);
            
            for(let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 15 + Math.random() * 10;
                
                spawnProjectile(
                    m.pos.x, m.pos.y,
                    angle, speed, 3 + Math.random() * 3,
                    {
                        name: "chaos_orb",
                        dmg: 0.2 + Math.random() * 0.3,
                        ttl: 60 + Math.floor(Math.random() * 40),
                        do() {
                            const colors = ["#f80", "#f08", "#08f", "#0f8"];
                            pushVFX(
                                this.position.x, this.position.y,
                                this.radius * 1.5,
                                colors[Math.floor(Math.random() * colors.length)] + "44",
                                3
                            );
                        }
                    }
                );
            }
            pushVFX(m.pos.x, m.pos.y, 30, "rgba(255,128,0,0.5)", 8);
        },
        do() {}
    });

    // 9. Star Burst - explosive star pattern
    b.guns.push({
        name: "star burst",
        descriptionFunction() {
            return `creates an explosive <b style="color:#ff0">star pattern</b><br>shoots 8 projectiles in a circle`;
        },
        ammo: 32,
        ammoPack: 8,
        defaultAmmoPack: 8,
        have: false,
        fire() {
            m.fireCDcycle = m.cycle + 45;
            
            for(let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                spawnProjectile(
                    m.pos.x, m.pos.y,
                    angle, 20, 6,
                    {
                        name: "star_shard",
                        dmg: 0.5,
                        ttl: 100,
                        do() {
                            pushVFX(this.position.x, this.position.y, 10, "rgba(255,255,0,0.4)", 4);
                        },
                        onEnd() {
                            if(this.endCycle === simulation.cycle) {
                                b.explosion(this.position, 100);
                            }
                        }
                    }
                );
            }
            pushVFX(m.pos.x, m.pos.y, 40, "#ff0", 10);
        },
        do() {}
    });

    // 10. Graviton Wave - pulls enemies
    b.guns.push({
        name: "graviton wave",
        descriptionFunction() {
            return `emits a <b style="color:#c0f">graviton wave</b><br>pulls nearby enemies toward impact point`;
        },
        ammo: 25,
        ammoPack: 6,
        defaultAmmoPack: 6,
        have: false,
        fire() {
            const angle = m.angle;
            m.fireCDcycle = m.cycle + 50;
            
            spawnProjectile(
                m.pos.x + 30 * Math.cos(angle),
                m.pos.y + 30 * Math.sin(angle),
                angle, 15, 12,
                {
                    name: "graviton_wave",
                    dmg: 0.3,
                    ttl: 150,
                    do() {
                        pushVFX(this.position.x, this.position.y, 16, "rgba(200,0,255,0.3)", 4);
                        
                        // Pull nearby mobs
                        for(let i = 0; i < mob.length; i++) {
                            if(mob[i].alive) {
                                const dx = this.position.x - mob[i].position.x;
                                const dy = this.position.y - mob[i].position.y;
                                const dist2 = dx * dx + dy * dy;
                                if(dist2 < 90000) { // 300px radius
                                    const force = Vector.mult(
                                        Vector.normalise({x: dx, y: dy}),
                                        0.0005 * mob[i].mass
                                    );
                                    mob[i].force.x += force.x;
                                    mob[i].force.y += force.y;
                                }
                            }
                        }
                    },
                    onEnd() {
                        if(this.endCycle === simulation.cycle) {
                            b.explosion(this.position, 200);
                        }
                    }
                }
            );
            pushVFX(m.pos.x + 20 * Math.cos(angle), m.pos.y + 20 * Math.sin(angle), 25, "#c0f", 8);
        },
        do() {}
    });

    
    console.log("%cAnime guns mod loaded! (10 weapons)", "color: teal");
})();
