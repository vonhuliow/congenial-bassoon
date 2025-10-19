
// Battle Axe - Heavy Cleave Weapon (anime-style)
// Slow but powerful overhead strikes with knockback

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("battleAxe: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const BattleAxe = {
        name: "battle axe",
        descriptionFunction() {
            return `wield a <b style="color:#8b4513">massive battle axe</b><br><span style='color:#ff4500'>devastating cleave</span> with heavy knockback<br>drains <strong class='color-h'>health</strong> instead of ammunition`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        axe: null,
        bladeSegments: [],
        bladeTrails: [],
        cycle: 0,
        haveEphemera: false,
        fire() {},
        do() {
            if(!this.haveEphemera) {
                this.haveEphemera = true;
                simulation.ephemera.push({
                    name: "battleAxe",
                    do() {
                        if(b.guns[b.activeGun].name !== 'battle axe') {
                            for (let i = 0; i < b.inventory.length; i++) {
                                if(b.guns[b.inventory[i]].name === "battle axe" && b.guns[b.inventory[i]].axe) {
                                    Composite.remove(engine.world, b.guns[b.inventory[i]].axe);
                                    b.guns[b.inventory[i]].axe = null;
                                    b.guns[b.inventory[i]].bladeTrails = [];
                                }
                            }
                        }
                    }
                });
            }

            if (input.fire && !this.axe && b.guns[b.activeGun].name === 'battle axe') {
                if(tech.isEnergyHealth ? m.energy >= 0.08 : m.health >= 0.08) {
                    this.createAxe();
                    this.cycle = m.cycle;
                    
                    if(tech.isEnergyHealth) {
                        m.energy -= 0.08;
                    } else {
                        m.health -= 0.05;
                        m.displayHealth();
                    }
                }
            }

            if(this.axe) {
                this.cycle++;
                
                // Heavy swing
                const swingSpeed = (m.angle > -Math.PI / 2 && m.angle < Math.PI / 2) ? 0.25 : -0.25;
                Matter.Body.setAngularVelocity(this.axe, swingSpeed);
                
                // Follow player
                const targetX = m.pos.x + Math.cos(m.angle) * 100;
                const targetY = m.pos.y + Math.sin(m.angle) * 100;
                Matter.Body.setPosition(this.axe, { x: targetX, y: targetY });
                
                // Trail
                for (let i = 0; i < this.bladeSegments.length; i++) {
                    const blade = this.bladeSegments[i];
                    const trail = this.bladeTrails[i] || [];
                    const vertices = blade.vertices.map(v => ({ x: v.x, y: v.y }));
                    trail.push(vertices);
                    if (trail.length > 6) trail.shift();
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
                        ctx.fillStyle = `rgba(255, 69, 0, ${alpha * 0.4})`;
                        ctx.fill();
                    }
                }

                // Draw axe
                for(let i = 0; i < this.bladeSegments.length; i++) {
                    ctx.beginPath();
                    ctx.strokeStyle = "#8b4513";
                    ctx.lineWidth = 5;
                    ctx.fillStyle = "#a0522d";
                    ctx.moveTo(this.bladeSegments[i].vertices[0].x, this.bladeSegments[i].vertices[0].y);
                    for(let j = 0; j < this.bladeSegments[i].vertices.length; j++) {
                        ctx.lineTo(this.bladeSegments[i].vertices[j].x, this.bladeSegments[i].vertices[j].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                }

                // Collision with knockback
                for (let i = 0; i < mob.length; i++) {
                    if (mob[i].alive && Matter.Query.collides(this.axe, [mob[i]]).length > 0) {
                        const dmg = 0.25 * m.dmgScale;
                        mob[i].damage(dmg, true);
                        
                        // Heavy knockback
                        const angle = Math.atan2(mob[i].position.y - this.axe.position.y, 
                                                mob[i].position.x - this.axe.position.x);
                        mob[i].force.x += Math.cos(angle) * 0.8;
                        mob[i].force.y += Math.sin(angle) * 0.8;
                        
                        simulation.drawList.push({
                            x: mob[i].position.x,
                            y: mob[i].position.y,
                            radius: 80,
                            color: "rgba(255, 69, 0, 0.7)",
                            time: simulation.drawTime
                        });
                        break;
                    }
                }

                // Remove after swing
                if(this.cycle > m.cycle + 50) {
                    Composite.remove(engine.world, this.axe);
                    this.axe = null;
                    this.bladeTrails = [];
                    m.fireCDcycle = m.cycle + 40;
                }
            }
        },
        createAxe() {
            const pos = m.pos;
            const handle = Bodies.rectangle(pos.x, pos.y, 25, 180, spawn.propsIsNotHoldable);
            
            // Axe head - wide blade
            const blade1Vertices = [
                { x: -80, y: -100 },
                { x: 80, y: -100 },
                { x: 20, y: 0 },
                { x: -20, y: 0 }
            ];
            const blade1 = Bodies.fromVertices(pos.x, pos.y - 140, blade1Vertices, spawn.propsIsNotHoldable);
            
            const blade2Vertices = [
                { x: -60, y: 0 },
                { x: 60, y: 0 },
                { x: 15, y: 40 },
                { x: -15, y: 40 }
            ];
            const blade2 = Bodies.fromVertices(pos.x, pos.y - 120, blade2Vertices, spawn.propsIsNotHoldable);
            
            const axe = Body.create({ parts: [handle, blade1, blade2] });
            Composite.add(engine.world, axe);
            
            axe.collisionFilter.category = cat.bullet;
            axe.collisionFilter.mask = cat.mob | cat.mobBullet;
            
            this.axe = axe;
            this.bladeSegments = [handle, blade1, blade2];
        }
    };

    b.guns.push(BattleAxe);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cBattle Axe mod loaded!", "color: #8b4513");
})();
