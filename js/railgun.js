
// Railgun - Electromagnetic Projectile Weapon (sci-fi style)
// Fires high-velocity projectiles with piercing capability

(function() {
    'use strict';
    
    if(typeof b === 'undefined' || typeof Bodies === 'undefined' || typeof Composite === 'undefined') {
        console.warn("railgun: required globals missing. Retrying...");
        setTimeout(arguments.callee, 100);
        return;
    }

    const Railgun = {
        name: "railgun",
        descriptionFunction() {
            return `fires <b style="color:#00ffff">electromagnetic projectiles</b><br>pierces through multiple enemies with devastating force`;
        },
        ammo: 30,
        ammoPack: 10,
        defaultAmmoPack: 10,
        have: false,
        fire() {
            const angle = m.angle;
            m.fireCDcycle = m.cycle + 60;
            
            // Create projectile
            const projectile = Bodies.rectangle(
                m.pos.x + Math.cos(angle) * 50,
                m.pos.y + Math.sin(angle) * 50,
                40, 6,
                spawn.propsIsNotHoldable
            );
            
            Composite.add(engine.world, projectile);
            projectile.collisionFilter.category = cat.bullet;
            projectile.collisionFilter.mask = cat.mob | cat.mobBullet | cat.map;
            projectile.classType = "bullet";
            projectile.dmg = 1.5 * m.dmgScale;
            projectile.minDmgSpeed = 10;
            
            const speed = 45;
            Body.setVelocity(projectile, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
            
            Body.setAngle(projectile, angle);
            projectile.endCycle = m.cycle + 120;
            projectile._hitCount = 0;
            projectile._maxHits = 3;
            
            projectile.beforeDmg = function(who) {
                this._hitCount++;
                if(this._hitCount >= this._maxHits) {
                    this.endCycle = 0;
                }
            };
            
            projectile.do = function() {
                // Electromagnetic field effect
                ctx.save();
                ctx.translate(this.position.x, this.position.y);
                ctx.rotate(this.angle);
                
                // Electric field
                for(let i = 0; i < 3; i++) {
                    const offset = (m.cycle + i * 10) % 30;
                    ctx.strokeStyle = `rgba(0, 255, 255, ${1 - offset / 30})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, 10 + offset, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Projectile core
                ctx.fillStyle = "#00ffff";
                ctx.fillRect(-20, -3, 40, 6);
                
                // Glow
                const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
                grd.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
                grd.addColorStop(1, 'rgba(0, 255, 255, 0)');
                ctx.fillStyle = grd;
                ctx.fillRect(-25, -10, 50, 20);
                
                ctx.restore();
                
                // Trail particles
                if(typeof simulation !== 'undefined' && simulation.drawList) {
                    simulation.drawList.push({
                        x: this.position.x,
                        y: this.position.y,
                        radius: 8,
                        color: "rgba(0, 255, 255, 0.5)",
                        time: 5
                    });
                }
            };
            
            bullet.push(projectile);
            
            // Muzzle flash
            if(typeof simulation !== 'undefined' && simulation.drawList) {
                simulation.drawList.push({
                    x: m.pos.x + Math.cos(angle) * 50,
                    y: m.pos.y + Math.sin(angle) * 50,
                    radius: 40,
                    color: "rgba(0, 255, 255, 0.7)",
                    time: 10
                });
            }
            
            // Recoil
            m.force.x -= Math.cos(angle) * 0.15;
            m.force.y -= Math.sin(angle) * 0.15;
        },
        do() {}
    };

    b.guns.push(Railgun);
    b.guns = b.guns.filter((g, i, arr) => i === arr.findIndex(x => x.name === g.name));
    console.log("%cRailgun mod loaded!", "color: #00ffff");
})();
