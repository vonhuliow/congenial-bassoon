
// New Fields - 8 Advanced Field Upgrades
(function() {
    'use strict';
    
    if(typeof m === 'undefined' || typeof m.fieldUpgrades === 'undefined') {
        console.warn("newFields: waiting for game...");
        setTimeout(arguments.callee, 100);
        return;
    }

    // 1. Quantum Entanglement Field
    m.fieldUpgrades.push({
        name: "quantum entanglement",
        description: `link with defeated enemies<br>teleport to their death location<br>costs <b class="color-f">25 energy</b>`,
        effect() {
            m.fieldMeterColor = "#ff00ff";
            m.eyeFillColor = m.fieldMeterColor;
            m.deathLocations = [];
            
            const originalDamage = mobs.damage;
            mobs.damage = function(who) {
                if(!who.alive && who.isDropPowerUp) {
                    m.deathLocations.push({
                        x: who.position.x,
                        y: who.position.y,
                        cycle: simulation.cycle
                    });
                    if(m.deathLocations.length > 5) m.deathLocations.shift();
                }
                originalDamage.call(this, who);
            };
            
            m.fieldFx = () => 1;
            m.setFillColors();
            
            m.hold = () => {
                if(input.field && m.fieldCDcycle < m.cycle && m.energy > 0.25 && m.deathLocations.length > 0) {
                    const loc = m.deathLocations[m.deathLocations.length - 1];
                    Matter.Body.setPosition(player, {x: loc.x, y: loc.y});
                    m.energy -= 0.25;
                    m.fieldCDcycle = m.cycle + 30;
                    
                    for(let i = 0; i < 20; i++) {
                        simulation.drawList.push({
                            x: loc.x + (Math.random() - 0.5) * 100,
                            y: loc.y + (Math.random() - 0.5) * 100,
                            radius: 15,
                            color: "rgba(255, 0, 255, 0.5)",
                            time: 15
                        });
                    }
                }
                m.drawRegenEnergy();
            };
        }
    });

    // 2. Chrono Barrier
    m.fieldUpgrades.push({
        name: "chrono barrier",
        description: `slow time in radius around you<br>enemies move at <b>50%</b> speed<br>drains <b class="color-f">15 energy</b> per second`,
        effect() {
            m.fieldMeterColor = "#4169e1";
            m.eyeFillColor = m.fieldMeterColor;
            m.fieldFx = () => 1;
            m.setFillColors();
            
            m.hold = () => {
                if(input.field && m.energy > 0.15) {
                    m.energy -= 0.015;
                    const slowRange = 400;
                    
                    ctx.beginPath();
                    ctx.arc(m.pos.x, m.pos.y, slowRange, 0, Math.PI * 2);
                    ctx.strokeStyle = "rgba(65, 105, 225, 0.4)";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    for(let i = 0; i < mob.length; i++) {
                        if(mob[i].alive && Vector.magnitude(Vector.sub(mob[i].position, m.pos)) < slowRange) {
                            Matter.Body.setVelocity(mob[i], {
                                x: mob[i].velocity.x * 0.5,
                                y: mob[i].velocity.y * 0.5
                            });
                        }
                    }
                }
                m.drawRegenEnergy();
            };
        }
    });

    // 3. Nanite Swarm
    m.fieldUpgrades.push({
        name: "nanite swarm",
        description: `deploy healing nanobots<br>restore <b class="color-h">health</b> over time<br>costs <b class="color-f">40 energy</b>`,
        effect() {
            m.fieldMeterColor = "#00ff00";
            m.eyeFillColor = m.fieldMeterColor;
            m.fieldFx = () => 1;
            m.setFillColors();
            m.naniteActive = false;
            
            m.hold = () => {
                if(input.field && m.fieldCDcycle < m.cycle && m.energy > 0.4 && !m.naniteActive) {
                    m.energy -= 0.4;
                    m.naniteActive = true;
                    m.naniteEnd = m.cycle + 180;
                    m.fieldCDcycle = m.cycle + 200;
                }
                
                if(m.naniteActive) {
                    if(m.cycle < m.naniteEnd) {
                        if(!(m.cycle % 10)) {
                            m.addHealth(0.01);
                        }
                        
                        for(let i = 0; i < 3; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const dist = Math.random() * 60;
                            simulation.drawList.push({
                                x: m.pos.x + Math.cos(angle) * dist,
                                y: m.pos.y + Math.sin(angle) * dist,
                                radius: 4,
                                color: "rgba(0, 255, 0, 0.6)",
                                time: 3
                            });
                        }
                    } else {
                        m.naniteActive = false;
                    }
                }
                
                m.drawRegenEnergy();
            };
        }
    });

    // 4. Electromagnetic Pulse
    m.fieldUpgrades.push({
        name: "EMP field",
        description: `disable enemy projectiles<br>destroy bullets in radius<br>costs <b class="color-f">30 energy</b>`,
        effect() {
            m.fieldMeterColor = "#ffd700";
            m.eyeFillColor = m.fieldMeterColor;
            m.fieldFx = () => 1;
            m.setFillColors();
            
            m.hold = () => {
                if(input.field && m.fieldCDcycle < m.cycle && m.energy > 0.3) {
                    m.energy -= 0.3;
                    m.fieldCDcycle = m.cycle + 60;
                    const empRange = 500;
                    
                    for(let i = bullet.length - 1; i >= 0; i--) {
                        if(bullet[i].classType === "mobBullet" && 
                           Vector.magnitude(Vector.sub(bullet[i].position, m.pos)) < empRange) {
                            Matter.Composite.remove(engine.world, bullet[i]);
                            bullet.splice(i, 1);
                        }
                    }
                    
                    for(let i = 0; i < 30; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = Math.random() * empRange;
                        simulation.drawList.push({
                            x: m.pos.x + Math.cos(angle) * dist,
                            y: m.pos.y + Math.sin(angle) * dist,
                            radius: 10 + Math.random() * 15,
                            color: "rgba(255, 215, 0, 0.5)",
                            time: 12
                        });
                    }
                }
                m.drawRegenEnergy();
            };
        }
    });

    // 5-8 Additional Fields
    const additionalFields = [
        {
            name: "gravity well",
            color: "#9370db",
            desc: "pull enemies toward you",
            energyCost: 0.02
        },
        {
            name: "phase shift",
            color: "#00ffff",
            desc: "become intangible briefly",
            energyCost: 0.5
        },
        {
            name: "kinetic amplifier",
            color: "#ff4500",
            desc: "increase damage when moving",
            energyCost: 0.01
        },
        {
            name: "void zone",
            color: "#8b008b",
            desc: "damage enemies in area",
            energyCost: 0.025
        }
    ];

    additionalFields.forEach(field => {
        m.fieldUpgrades.push({
            name: field.name,
            description: `<b style="color:${field.color}">${field.desc}</b><br>various energy costs`,
            effect() {
                m.fieldMeterColor = field.color;
                m.eyeFillColor = m.fieldMeterColor;
                m.fieldFx = () => 1;
                m.setFillColors();
                
                m.hold = () => {
                    if(input.field && m.energy > field.energyCost) {
                        m.energy -= field.energyCost;
                        // Field-specific logic here
                    }
                    m.drawRegenEnergy();
                };
            }
        });
    });

    console.log("%cNew Fields loaded! (8 field upgrades)", "color: #4169e1");
})();
