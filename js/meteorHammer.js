
// Meteor Hammer - Heavy Spinning Weapon (anime-style)
// Swing a massive hammer that spins and deals area damage

const MeteorHammer = {
  name: "meteor-hammer",
  descriptionFunction() {
    return "Meteor Hammer — massive spinning hammer with AOE damage and knockback.";
  },
  have: false,
  ammo: Infinity,
  ammoPack: Infinity,
  defaultAmmoPack: Infinity,
  hammer: null,
  headSegments: [],
  headTrails: [],
  angle: 0,
  spinSpeed: 0,
  
  fire() {},
  
  do() {
    if (input.fire && b.guns[b.activeGun].name === 'meteor-hammer') {
      if (!this.hammer) {
        this.createHammer();
      }
      
      if (this.hammer) {
        // Increase spin speed
        this.spinSpeed = Math.min(this.spinSpeed + 0.02, 0.3);
        Matter.Body.setAngularVelocity(this.hammer, this.spinSpeed);
        
        // Position around player
        const radius = 150;
        const x = m.pos.x + Math.cos(this.hammer.angle) * radius;
        const y = m.pos.y + Math.sin(this.hammer.angle) * radius;
        Matter.Body.setPosition(this.hammer, { x, y });
        
        // Collision detection
        for (let i = 0; i < mob.length; i++) {
          if (Matter.Query.collides(this.hammer, [mob[i]]).length > 0) {
            const dmg = (m.damageDone || m.dmgScale) * 0.25;
            mob[i].damage(dmg, true);
            
            // Knockback
            const angle = Math.atan2(mob[i].position.y - this.hammer.position.y, 
                                    mob[i].position.x - this.hammer.position.x);
            mob[i].force.x += Math.cos(angle) * 0.5;
            mob[i].force.y += Math.sin(angle) * 0.5;
            
            simulation.drawList.push({
              x: mob[i].position.x,
              y: mob[i].position.y,
              radius: 80,
              color: "#ff6600",
              time: simulation.drawTime
            });
          }
        }
        
        // Draw
        ctx.beginPath();
        ctx.arc(this.hammer.position.x, this.hammer.position.y, 50, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff6600";
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    } else if (this.hammer) {
      Composite.remove(engine.world, this.hammer);
      this.hammer = null;
      this.spinSpeed = 0;
    }
  },
  
  createHammer() {
    this.hammer = Bodies.circle(m.pos.x, m.pos.y, 50, {
      density: 0.1,
      frictionAir: 0.01,
      collisionFilter: {
        category: cat.bullet,
        mask: cat.mob
      }
    });
    Composite.add(engine.world, this.hammer);
  }
};

b.guns.push(MeteorHammer);
console.log("%cMeteor Hammer loaded!", "color: #ff6600");
