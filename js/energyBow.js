
// Energy Bow - Charged Arrow Weapon (anime-style)
// Fires energy arrows with charge mechanic

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("energyBow: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const EnergyBow = {
        name: "energy bow",
        descriptionFunction() {
            return `fires <b style="color:#00ff00">energy arrows</b><br>hold to charge for increased damage and speed`;
        },
        ammo: 60,
        ammoPack: 20,
        defaultAmmoPack: 20,
        have: false,
        charge: 0,
        maxCharge: 90,
        fire() {},
        do() {
            // Charge while holding fire
            if(input.fire && this.charge < this.maxCharge) {
                this.charge = Math.min(this.maxCharge, this.charge + 2);
                
                // Visual charge effect
                if(this.charge > 15) {
                    simulation.drawList.push({
                        x: m.pos.x + Math.cos(m.angle) * 40,
                        y: m.pos.y + Math.sin(m.angle) * 40,
                        radius: 8 + this.charge * 0.3,
                        color: `rgba(0, 255, 0, ${this.charge / this.maxCharge})`,
                        time: 2
                    });
                }
            }
            
            // Release arrow
            if(!input.fire && this.charge > 15 && m.fireCDcycle < m.cycle) {
                const power = this.charge / this.maxCharge;
                const angle = m.angle;
                const speed = 15 + power * 25;
                
                const arrow = Bodies.rectangle(
                    m.pos.x + Math.cos(angle) * 40,
                    m.pos.y + Math.sin(angle) * 40,
                    50 * (1 + power * 0.5), 8,
                    spawn.propsIsNotHoldable
                );
                
                Composite.add(engine.world, arrow);
                arrow.collisionFilter.category = cat.bullet;
                arrow.collisionFilter.mask = cat.mob | cat.mobBullet | cat.map;
                arrow.classType = "bullet";
                arrow.dmg = 0.5 * (1 + power * 2) * m.dmgScale;
                arrow.minDmgSpeed = 5;
                
                Body.setVelocity(arrow, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                });
                
                Body.setAngle(arrow, angle);
                arrow.endCycle = m.cycle + 150;
                arrow._power = power;
                
                arrow.do = function() {
                    // Arrow trail
                    ctx.save();
                    ctx.translate(this.position.x, this.position.y);
                    ctx.rotate(this.angle);
                    
                    // Glow
                    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
                    grd.addColorStop(0, `rgba(0, 255, 0, ${this._power || 0.5})`);
                    grd.addColorStop(1, 'rgba(0, 255, 0, 0)');
                    ctx.fillStyle = grd;
                    ctx.fillRect(-30, -15, 60, 30);
                    
                    // Arrow
                    ctx.fillStyle = "#00ff00";
                    ctx.beginPath();
                    ctx.moveTo(25, 0);
                    ctx.lineTo(-20, -4);
                    ctx.lineTo(-20, 4);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                };
                
                bullet.push(arrow);
                
                m.fireCDcycle = m.cycle + 20;
                this.charge = 0;
                b.guns[b.activeGun].ammo--;
                simulation.updateGunHUD();
                
                // Visual release effect
                simulation.drawList.push({
                    x: m.pos.x + Math.cos(angle) * 40,
                    y: m.pos.y + Math.sin(angle) * 40,
                    radius: 30,
                    color: "rgba(0, 255, 0, 0.6)",
                    time: 8
                });
            }
            
            // Reset charge if not firing
            if(!input.fire && this.charge < 15) {
                this.charge = 0;
            }
        }
    };

    b.guns.push(EnergyBow);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cEnergy Bow mod loaded!", "color: #00ff00");
})();
