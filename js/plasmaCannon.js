
// Plasma Cannon - Explosive Energy Weapon (sci-fi style)
// Fires slow-moving plasma orbs that explode on impact

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("plasmaCannon: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const PlasmaCannon = {
        name: "plasma cannon",
        descriptionFunction() {
            return `fires <b style="color:#ff00ff">superheated plasma orbs</b><br>explodes on impact with area damage`;
        },
        ammo: 40,
        ammoPack: 12,
        defaultAmmoPack: 12,
        have: false,
        fire() {
            const angle = m.angle;
            m.fireCDcycle = m.cycle + 45;
            
            // Create plasma orb
            const orb = Bodies.circle(
                m.pos.x + Math.cos(angle) * 50,
                m.pos.y + Math.sin(angle) * 50,
                18,
                spawn.propsIsNotHoldable
            );
            
            Composite.add(engine.world, orb);
            orb.collisionFilter.category = cat.bullet;
            orb.collisionFilter.mask = cat.mob | cat.mobBullet | cat.map;
            orb.classType = "bullet";
            orb.dmg = 0.8 * m.dmgScale;
            orb.minDmgSpeed = 3;
            
            const speed = 12;
            Body.setVelocity(orb, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
            
            orb.endCycle = m.cycle + 180;
            orb._born = m.cycle;
            
            orb.beforeDmg = function(who) {
                this.endCycle = 0;
            };
            
            orb.onEnd = function() {
                if(this.endCycle === simulation.cycle) {
                    // Explosion effect
                    b.explosion(this.position, 150);
                    
                    // Visual explosion
                    for(let i = 0; i < 8; i++) {
                        simulation.drawList.push({
                            x: this.position.x + (Math.random() - 0.5) * 80,
                            y: this.position.y + (Math.random() - 0.5) * 80,
                            radius: 30 + Math.random() * 40,
                            color: `rgba(255, 0, 255, ${0.4 + Math.random() * 0.4})`,
                            time: 15
                        });
                    }
                }
            };
            
            orb.do = function() {
                // Plasma effect
                ctx.save();
                ctx.translate(this.position.x, this.position.y);
                
                // Pulsing glow
                const pulse = Math.sin((m.cycle - this._born) * 0.2) * 0.3 + 0.7;
                
                // Outer glow
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
                grd.addColorStop(0, `rgba(255, 0, 255, ${pulse})`);
                grd.addColorStop(0.5, `rgba(255, 100, 255, ${pulse * 0.5})`);
                grd.addColorStop(1, 'rgba(255, 0, 255, 0)');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(0, 0, 25, 0, Math.PI * 2);
                ctx.fill();
                
                // Core
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Energy arcs
                for(let i = 0; i < 3; i++) {
                    const arcAngle = (m.cycle * 0.1 + i * Math.PI * 2 / 3) % (Math.PI * 2);
                    const arcRadius = 15;
                    ctx.strokeStyle = `rgba(255, 0, 255, ${pulse * 0.6})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(arcAngle) * arcRadius, Math.sin(arcAngle) * arcRadius);
                    ctx.stroke();
                }
                
                ctx.restore();
            };
            
            bullet.push(orb);
            
            // Launch effect
            simulation.drawList.push({
                x: m.pos.x + Math.cos(angle) * 50,
                y: m.pos.y + Math.sin(angle) * 50,
                radius: 35,
                color: "rgba(255, 0, 255, 0.6)",
                time: 8
            });
        },
        do() {}
    };

    b.guns.push(PlasmaCannon);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cPlasma Cannon mod loaded!", "color: #ff00ff");
})();
