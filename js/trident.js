
// Tri-Trident - Triple Projectile Weapon (anime-style)
// Throws three water-based projectiles in a spread

const TriTrident = {
  name: "tri-trident",
  descriptionFunction() {
    return "Tri-Trident — throws three water spears in a spread pattern.";
  },
  have: false,
  ammo: 45,
  ammoPack: 15,
  defaultAmmoPack: 15,
  
  fire() {
    const spreadAngle = Math.PI / 12;
    
    for (let i = -1; i <= 1; i++) {
      const angle = m.angle + i * spreadAngle;
      const me = bullet.length;
      
      bullet[me] = Bodies.rectangle(
        m.pos.x + 30 * Math.cos(angle),
        m.pos.y + 30 * Math.sin(angle),
        40, 8,
        b.fireAttributes(angle)
      );
      
      bullet[me].dmg = 0.8;
      Matter.Body.setVelocity(bullet[me], {
        x: 25 * Math.cos(angle),
        y: 25 * Math.sin(angle)
      });
      
      Composite.add(engine.world, bullet[me]);
      
      bullet[me].do = function() {
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, 6, 0, 2 * Math.PI);
        ctx.fill();
      };
    }
    
    m.fireCDcycle = m.cycle + 20;
  },
  
  do() {}
};

b.guns.push(TriTrident);
console.log("%cTri-Trident loaded!", "color: #00ffff");
