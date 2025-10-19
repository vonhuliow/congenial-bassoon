
// Chain-Scythe - Extending Chain Weapon (anime-style)
// Throwable scythe on a chain that can be pulled back

const ChainScythe = {
  name: "chain-scythe",
  descriptionFunction() {
    return "Chain-Scythe — throwable scythe on a chain that returns to you.";
  },
  have: false,
  ammo: Infinity,
  ammoPack: Infinity,
  defaultAmmoPack: Infinity,
  scythe: null,
  isExtending: false,
  maxLength: 500,
  currentLength: 0,
  
  fire() {},
  
  do() {
    if (input.fire && !this.scythe && b.guns[b.activeGun].name === 'chain-scythe') {
      this.throwScythe();
    }
    
    if (this.scythe) {
      if (this.isExtending) {
        this.currentLength += 30;
        if (this.currentLength >= this.maxLength) {
          this.isExtending = false;
        }
      } else {
        this.currentLength -= 40;
        if (this.currentLength <= 0) {
          Composite.remove(engine.world, this.scythe);
          this.scythe = null;
          this.currentLength = 0;
          m.fireCDcycle = m.cycle + 30;
        }
      }
      
      if (this.scythe) {
        // Pull toward player
        const dx = m.pos.x - this.scythe.position.x;
        const dy = m.pos.y - this.scythe.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (!this.isExtending && dist > 50) {
          this.scythe.force.x = (dx / dist) * 0.03;
          this.scythe.force.y = (dy / dist) * 0.03;
        }
        
        Matter.Body.setAngularVelocity(this.scythe, 0.3);
        
        // Draw chain
        ctx.beginPath();
        ctx.moveTo(m.pos.x, m.pos.y);
        ctx.lineTo(this.scythe.position.x, this.scythe.position.y);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw scythe
        ctx.save();
        ctx.translate(this.scythe.position.x, this.scythe.position.y);
        ctx.rotate(this.scythe.angle);
        ctx.fillStyle = "#8b0000";
        ctx.fillRect(-30, -5, 60, 10);
        ctx.fillRect(20, -25, 10, 30);
        ctx.restore();
        
        // Collision
        for (let i = 0; i < mob.length; i++) {
          if (Matter.Query.collides(this.scythe, [mob[i]]).length > 0) {
            const dmg = (m.damageDone || m.dmgScale) * 0.2;
            mob[i].damage(dmg, true);
            simulation.drawList.push({
              x: mob[i].position.x,
              y: mob[i].position.y,
              radius: 60,
              color: "#8b0000",
              time: simulation.drawTime
            });
          }
        }
      }
    }
  },
  
  throwScythe() {
    this.scythe = Bodies.rectangle(
      m.pos.x + 40 * Math.cos(m.angle),
      m.pos.y + 40 * Math.sin(m.angle),
      60, 10
    );
    
    this.scythe.collisionFilter = {
      category: cat.bullet,
      mask: cat.mob
    };
    
    Matter.Body.setVelocity(this.scythe, {
      x: 20 * Math.cos(m.angle),
      y: 20 * Math.sin(m.angle)
    });
    
    Composite.add(engine.world, this.scythe);
    this.isExtending = true;
    this.currentLength = 0;
  }
};

b.guns.push(ChainScythe);
console.log("%cChain-Scythe loaded!", "color: #8b0000");
