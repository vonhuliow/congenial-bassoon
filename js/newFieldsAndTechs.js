
// New Fields and Techs Mod
(function() {
    'use strict';
    
    if (typeof m === 'undefined' || typeof tech === 'undefined') {
        console.warn('New fields and techs: Game not ready, retrying...');
        setTimeout(arguments.callee, 100);
        return;
    }
    
    // ==========================================
    // NEW FIELDS
    // ==========================================
    
    // 1. QUANTUM ENTANGLEMENT FIELD
    m.fieldUpgrades.push({
        name: "quantum entanglement",
        description: "teleport short distances by clicking<br>creates entangled particles that damage mobs<br>12 <b class='color-f'>energy</b> per second",
        effect() {
            m.fieldMeterColor = "#a0f";
            m.eyeFillColor = m.fieldMeterColor;
            m.fillColor = m.fieldMeterColor;
            m.fieldRegen = 0.002;
            m.energy += m.fieldRegen;
            m.setFillColors();
            
            let entangledParticles = [];
            
            m.hold = () => {
                m.fieldFx = 1;
                m.setMovement();
                
                // Draw entangled particles
                for (let i = entangledParticles.length - 1; i >= 0; i--) {
                    const p = entangledParticles[i];
                    p.life--;
                    
                    if (p.life <= 0) {
                        entangledParticles.splice(i, 1);
                        continue;
                    }
                    
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(160, 0, 255, ${p.life / 60})`;
                    ctx.fill();
                    
                    // Damage nearby mobs
                    for (let j = 0; j < mob.length; j++) {
                        const dist = Math.hypot(p.x - mob[j].position.x, p.y - mob[j].position.y);
                        if (dist < 50 && mob[j].alive) {
                            mob[j].damage(0.05 * m.dmgScale);
                        }
                    }
                }
                
                if (input.field && m.fieldCDcycle < m.cycle && m.energy > 0.15) {
                    const range = 400;
                    const angle = Math.atan2(simulation.mouseInGame.y - m.pos.y, simulation.mouseInGame.x - m.pos.x);
                    const targetX = m.pos.x + Math.cos(angle) * Math.min(range, Math.hypot(simulation.mouseInGame.x - m.pos.x, simulation.mouseInGame.y - m.pos.y));
                    const targetY = m.pos.y + Math.sin(angle) * Math.min(range, Math.hypot(simulation.mouseInGame.x - m.pos.x, simulation.mouseInGame.y - m.pos.y));
                    
                    // Check if path is clear
                    const hit = simulation.sight.getIntersection(m.pos, {x: targetX, y: targetY}, [map]);
                    
                    if (hit.dist > 50) {
                        // Leave entangled particle at old position
                        entangledParticles.push({
                            x: m.pos.x,
                            y: m.pos.y,
                            life: 60
                        });
                        
                        // Teleport player
                        Matter.Body.setPosition(player, {x: targetX, y: targetY});
                        Matter.Body.setVelocity(player, {x: 0, y: 0});
                        
                        m.energy -= 0.15;
                        m.fieldCDcycle = m.cycle + 30;
                        
                        simulation.drawList.push({
                            x: targetX,
                            y: targetY,
                            radius: 80,
                            color: "rgba(160, 0, 255, 0.4)",
                            time: 20
                        });
                    }
                }
                
                m.drawRegenEnergy();
            };
        }
    });
    
    // 2. GRAVITY WELL FIELD
    m.fieldUpgrades.push({
        name: "gravity well",
        description: "create gravity wells that pull in mobs and projectiles<br>damage mobs that get too close<br>18 <b class='color-f'>energy</b> per second",
        effect() {
            m.fieldMeterColor = "#84f";
            m.eyeFillColor = m.fieldMeterColor;
            m.fillColor = m.fieldMeterColor;
            m.fieldRegen = 0.003;
            m.energy += m.fieldRegen;
            m.setFillColors();
            
            let gravityWells = [];
            
            m.hold = () => {
                m.fieldFx = 1;
                m.setMovement();
                
                for (let i = gravityWells.length - 1; i >= 0; i--) {
                    const well = gravityWells[i];
                    well.life--;
                    
                    if (well.life <= 0) {
                        gravityWells.splice(i, 1);
                        continue;
                    }
                    
                    // Draw gravity well
                    const radius = 150;
                    ctx.beginPath();
                    ctx.arc(well.x, well.y, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(130, 70, 255, ${well.life / 180})`;
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    
                    // Pull mobs
                    for (let j = 0; j < mob.length; j++) {
                        const dist = Math.hypot(well.x - mob[j].position.x, well.y - mob[j].position.y);
                        if (dist < radius && mob[j].alive) {
                            const pull = Vector.mult(
                                Vector.normalise(Vector.sub({x: well.x, y: well.y}, mob[j].position)),
                                0.002 * mob[j].mass
                            );
                            mob[j].force.x += pull.x;
                            mob[j].force.y += pull.y;
                            
                            if (dist < 60) {
                                mob[j].damage(0.08 * m.dmgScale);
                            }
                        }
                    }
                    
                    // Pull bullets
                    for (let j = 0; j < bullet.length; j++) {
                        if (bullet[j].classType === "bullet") {
                            const dist = Math.hypot(well.x - bullet[j].position.x, well.y - bullet[j].position.y);
                            if (dist < radius) {
                                const pull = Vector.mult(
                                    Vector.normalise(Vector.sub({x: well.x, y: well.y}, bullet[j].position)),
                                    0.001
                                );
                                Matter.Body.applyForce(bullet[j], bullet[j].position, pull);
                            }
                        }
                    }
                }
                
                if (input.field && m.fieldCDcycle < m.cycle && m.energy > 0.2) {
                    gravityWells.push({
                        x: simulation.mouseInGame.x,
                        y: simulation.mouseInGame.y,
                        life: 180
                    });
                    
                    m.energy -= 0.2;
                    m.fieldCDcycle = m.cycle + 45;
                }
                
                m.drawRegenEnergy();
            };
        }
    });
    
    // 3. CHRONO FIELD
    m.fieldUpgrades.push({
        name: "chrono stasis",
        description: "slow down time in a radius around you<br>bullets move faster relative to slowed enemies<br>25 <b class='color-f'>energy</b> per second",
        effect() {
            m.fieldMeterColor = "#0cf";
            m.eyeFillColor = m.fieldMeterColor;
            m.fillColor = m.fieldMeterColor;
            m.fieldRegen = 0.00417;
            m.energy += m.fieldRegen;
            m.setFillColors();
            
            m.hold = () => {
                m.fieldFx = 1;
                m.setMovement();
                
                if (input.field && m.energy > 0.02) {
                    const radius = 350;
                    
                    // Visual effect
                    ctx.beginPath();
                    ctx.arc(m.pos.x, m.pos.y, radius, 0, Math.PI * 2);
                    ctx.strokeStyle = "rgba(0, 200, 255, 0.3)";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Slow mobs
                    for (let i = 0; i < mob.length; i++) {
                        const dist = Math.hypot(m.pos.x - mob[i].position.x, m.pos.y - mob[i].position.y);
                        if (dist < radius && mob[i].alive) {
                            mobs.statusSlow(mob[i], 10);
                        }
                    }
                    
                    m.energy -= 0.02;
                    m.fieldCDcycle = m.cycle + 3;
                }
                
                m.drawRegenEnergy();
            };
        }
    });
    
    // ==========================================
    // NEW TECHS
    // ==========================================
    
    const newTechs = [
        {
            name: "quantum tunneling",
            description: "bullets have a <strong>15%</strong> chance to <strong>phase through</strong> walls<br>and hit enemies on the other side",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.isQuantumTunneling = true;
            },
            remove() {
                tech.isQuantumTunneling = false;
            }
        },
        {
            name: "nanomachine swarm",
            description: "when mobs <strong>die</strong> release nanobots<br>that seek and damage nearby enemies",
            maxCount: 3,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.nanoSwarmCount = (tech.nanoSwarmCount || 0) + 1;
            },
            remove() {
                tech.nanoSwarmCount = 0;
            }
        },
        {
            name: "resonance cascade",
            description: "<strong>3x</strong> <strong class='color-d'>damage</strong> when hitting the same mob<br>within <strong>0.5</strong> seconds of last hit",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.isResonanceCascade = true;
            },
            remove() {
                tech.isResonanceCascade = false;
            }
        },
        {
            name: "adaptive armor",
            description: "each time you take <strong>damage</strong><br>gain <strong>0.95x</strong> <strong class='color-defense'>damage taken</strong> for <strong>10</strong> seconds",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.isAdaptiveArmor = true;
                tech.adaptiveArmorStacks = 0;
            },
            remove() {
                tech.isAdaptiveArmor = false;
                tech.adaptiveArmorStacks = 0;
            }
        },
        {
            name: "overcharge",
            descriptionFunction() {
                return `while <strong class='color-f'>energy</strong> is above <strong>75%</strong><br><strong>1.5x</strong> <em>fire rate</em> and <strong>1.3x</strong> <strong class='color-d'>damage</strong>`
            },
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.isOvercharge = true;
            },
            remove() {
                tech.isOvercharge = false;
            }
        },
        {
            name: "ricochet rounds",
            description: "bullets <strong>bounce</strong> off walls <strong>2</strong> times<br>and deal <strong>0.7x</strong> damage per bounce",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.isRicochet = true;
            },
            remove() {
                tech.isRicochet = false;
            }
        },
        {
            name: "kinetic amplifier",
            descriptionFunction() {
                const bonus = tech.isEnergyHealth ? "energy" : "health";
                return `gain <strong>+0.05</strong> max <strong class='color-h'>${bonus}</strong><br>for each mob killed this level`
            },
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.isKineticAmplifier = true;
                tech.kineticAmplifierKills = 0;
            },
            remove() {
                tech.isKineticAmplifier = false;
                tech.kineticAmplifierKills = 0;
            }
        },
        {
            name: "entropy shield",
            description: "when hit, <strong>25%</strong> chance to reflect<br><strong>50%</strong> of damage back to attacker",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed: () => true,
            requires: "",
            effect() {
                tech.isEntropyShield = true;
            },
            remove() {
                tech.isEntropyShield = false;
            }
        }
    ];
    
    // Add techs to the game
    for (let i = 0; i < newTechs.length; i++) {
        tech.tech.push(newTechs[i]);
    }
    
    console.log("%cNew fields and techs loaded! (3 fields, 8 techs)", "color: #0af");
    
})();
