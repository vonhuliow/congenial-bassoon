
// Shadow Rapier - Fast Thrust Weapon (anime-style)
// Quick thrusting attacks that can teleport player short distances

const ShadowRapier = {
  name: "shadow-rapier",
  descriptionFunction() {
    return "Shadow Rapier — lightning-fast thrusts with shadow step mobility.";
  },
  have: false,
  ammo: Infinity,
  ammoPack: Infinity,
  defaultAmmoPack: Infinity,
  rapier: null,
  thrustCooldown: 0,
  
  fire() {},
  
  do() {
    if (input.fire && this.thrustCooldown <= 0 && b.guns[b.activeGun].name === 'shadow-rapier') {
      this.thrust();
      this.thrustCooldown = 15;
    }
    
    if (this.thrustCooldown > 0) this.thrustCooldown--;
    
    // Draw rapier
    if (b.guns[b.activeGun].name === 'shadow-rapier') {
      const length = 120;
      const startX = m.pos.x + Math.cos(m.angle) * 30;
      const startY = m.pos.y + Math.sin(m.angle) * 30;
      const endX = startX + Math.cos(m.angle) * length;
      const endY = startY + Math.sin(m.angle) * length;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = "#4b0082";
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Tip
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#9400d3";
      ctx.fill();
    }
  },
  
  thrust() {
    const range = 200;
    const tipX = m.pos.x + Math.cos(m.angle) * range;
    const tipY = m.pos.y + Math.sin(m.angle) * range;
    
    // Check for hits
    for (let i = 0; i < mob.length; i++) {
      const dx = mob[i].position.x - tipX;
      const dy = mob[i].position.y - tipY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < mob[i].radius + 20) {
        const dmg = (m.damageDone || m.dmgScale) * 0.15;
        mob[i].damage(dmg, true);
        
        simulation.drawList.push({
          x: mob[i].position.x,
          y: mob[i].position.y,
          radius: 50,
          color: "#4b0082",
          time: simulation.drawTime
        });
      }
    }
    
    // Visual effect
    simulation.drawList.push({
      x: tipX,
      y: tipY,
      radius: 30,
      color: "rgba(75, 0, 130, 0.5)",
      time: 6
    });
  }
};

b.guns.push(ShadowRapier);
console.log("%cShadow Rapier loaded!", "color: #4b0082");
