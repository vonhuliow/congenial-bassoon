
// Katana - Fast Slash Melee Weapon (anime-style)
// Quick slashes with charge-up for powerful strike

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("katana: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const Katana = {
        name: "katana",
        descriptionFunction() {
            return `wield a <b style="color:#c0c0c0">swift katana</b><br>hold to charge for a <span style='color:#4169e1'>devastating slash</span><br>drains <strong class='color-h'>health</strong> instead of ammunition`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        katana: null,
        bladeSegments: [],
        bladeTrails: [],
        charge: 0,
        maxCharge: 60,
        cycle: 0,
        haveEphemera: false,
        fire() {},
        do() {
            if(!this.haveEphemera) {
                this.haveEphemera = true;
                simulation.ephemera.push({
                    name: "katana",
                    do() {
                        if(b.guns[b.activeGun].name !== 'katana') {
                            for (let i = 0; i < b.inventory.length; i++) {
                                if(b.guns[b.inventory[i]].name === "katana" && b.guns[b.inventory[i]].katana) {
                                    Composite.remove(engine.world, b.guns[b.inventory[i]].katana);
                                    b.guns[b.inventory[i]].katana = null;
                                    b.guns[b.inventory[i]].bladeTrails = [];
                                }
                            }
                        }
                    }
                });
            }

            // Charge mechanic
            if (input.fire && !this.katana && (tech.isEnergyHealth ? m.energy >= 0.05 : m.health >= 0.05)) {
                this.charge = Math.min(this.maxCharge, this.charge + 1);
                
                // Visual charge effect
                if(this.charge > 10) {
                    simulation.drawList.push({
                        x: m.pos.x,
                        y: m.pos.y,
                        radius: 10 + this.charge * 0.5,
                        color: `rgba(65, 105, 225, ${this.charge / this.maxCharge * 0.5})`,
                        time: 2
                    });
                }
            }

            // Release slash
            if(!input.fire && this.charge > 0 && !this.katana) {
                const power = 1 + (this.charge / this.maxCharge) * 2;
                this.createKatana(power);
                this.cycle = m.cycle;
                
                if(tech.isEnergyHealth) {
                    m.energy -= 0.03 * power;
                } else {
                    m.health -= 0.02 * power;
                    m.displayHealth();
                }
                
                this.charge = 0;
            }

            // Update katana
            if(this.katana) {
                this.cycle++;
                
                // Spin katana
                Matter.Body.setAngularVelocity(this.katana, 
                    (m.angle > -Math.PI / 2 && m.angle < Math.PI / 2) ? 0.4 : -0.4
                );
                
                // Position near player
                const targetX = m.pos.x + Math.cos(m.angle) * 80;
                const targetY = m.pos.y + Math.sin(m.angle) * 80;
                Matter.Body.setPosition(this.katana, { x: targetX, y: targetY });
                
                // Trail effect
                for (let i = 0; i < this.bladeSegments.length; i++) {
                    const blade = this.bladeSegments[i];
                    const trail = this.bladeTrails[i] || [];
                    const vertices = blade.vertices.map(v => ({ x: v.x, y: v.y }));
                    trail.push(vertices);
                    if (trail.length > 8) trail.shift();
                    this.bladeTrails[i] = trail;
                }

                // Draw trails
                for (let i = 0; i < this.bladeTrails.length; i++) {
                    const trail = this.bladeTrails[i];
                    const alphaStep = 1 / trail.length;
                    let alpha = 0;

                    for (let j = 0; j < trail.length; j++) {
                        const vertices = trail[j];
                        ctx.beginPath();
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let k = 1; k < vertices.length; k++) {
                            ctx.lineTo(vertices[k].x, vertices[k].y);
                        }
                        alpha += alphaStep;
                        ctx.closePath();
                        ctx.fillStyle = `rgba(192, 192, 192, ${alpha * 0.6})`;
                        ctx.fill();
                    }
                }

                // Draw katana
                for(let i = 0; i < this.bladeSegments.length; i++) {
                    ctx.beginPath();
                    ctx.strokeStyle = "#c0c0c0";
                    ctx.lineWidth = 4;
                    ctx.fillStyle = "#e8e8e8";
                    ctx.moveTo(this.bladeSegments[i].vertices[0].x, this.bladeSegments[i].vertices[0].y);
                    for(let j = 0; j < this.bladeSegments[i].vertices.length; j++) {
                        ctx.lineTo(this.bladeSegments[i].vertices[j].x, this.bladeSegments[i].vertices[j].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                }

                // Collision
                for (let i = 0; i < mob.length; i++) {
                    if (mob[i].alive && Matter.Query.collides(this.katana, [mob[i]]).length > 0) {
                        const dmg = 0.15 * m.dmgScale * (this.katana._power || 1);
                        mob[i].damage(dmg, true);
                        simulation.drawList.push({
                            x: mob[i].position.x,
                            y: mob[i].position.y,
                            radius: 50 * (this.katana._power || 1),
                            color: "rgba(192, 192, 255, 0.6)",
                            time: simulation.drawTime
                        });
                        break;
                    }
                }

                // Remove after duration
                if(this.cycle > m.cycle + 45) {
                    Composite.remove(engine.world, this.katana);
                    this.katana = null;
                    this.bladeTrails = [];
                }
            }
        },
        createKatana(power = 1) {
            const pos = m.pos;
            const handle = Bodies.rectangle(pos.x, pos.y, 15, 100, spawn.propsIsNotHoldable);
            
            const bladeVertices = [
                { x: -5, y: -150 },
                { x: 5, y: -150 },
                { x: 8, y: 0 },
                { x: -8, y: 0 }
            ];
            const blade = Bodies.fromVertices(pos.x, pos.y - 75, bladeVertices, spawn.propsIsNotHoldable);
            
            const katana = Body.create({ parts: [handle, blade] });
            Composite.add(engine.world, katana);
            
            katana.collisionFilter.category = cat.bullet;
            katana.collisionFilter.mask = cat.mob | cat.mobBullet;
            katana._power = power;
            
            this.katana = katana;
            this.bladeSegments = [handle, blade];
        }
    };

    b.guns.push(Katana);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cKatana mod loaded!", "color: #c0c0c0");
})();
