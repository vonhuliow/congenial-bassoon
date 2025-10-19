
javascript:(function() {
    const e = {
        name: "pinkBlossomHammer",
        descriptionFunction() {
            return `wield a <b>pink blossom hammer</b> that can <strong>smash</strong> in melee or be <strong>thrown</strong> and return<br>leaves a <span style='color:#ff69b4'>petal trail</span> and uses <strong class='color-h'>petal energy</strong> instead of ammo`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        fire() {},
        cycle: 0,
        cycle2: 0,
        hammer: undefined,
        headSegments: undefined,
        headTrails: [],
        angle: 0,
        constraint: undefined,
        durability: 220,
        maxDurability: 220,
        haveEphemera: false,
        right: true,
        do() {
            if (!this.haveEphemera) {
                this.haveEphemera = true;
                simulation.ephemera.push({
                    name: "pinkBlossomHammer",
                    do() {
                        if (b.guns[b.activeGun].name !== 'pinkBlossomHammer') {
                            for (let i = 0; i < b.inventory.length; i++) {
                                if (b.guns[b.inventory[i]].name === "pinkBlossomHammer" && b.guns[b.inventory[i]].hammer) {
                                    Composite.remove(engine.world, b.guns[b.inventory[i]].hammer);
                                    b.guns[b.inventory[i]].hammer = undefined;
                                    b.guns[b.inventory[i]].headTrails = [];
                                }
                            }
                        }
                        for (let i = 0; i < b.inventory.length; i++) {
                            if (b.guns[b.inventory[i]].name === "pinkBlossomHammer" && tech.durabilityHammer) {
                                document.getElementById(b.inventory[i]).innerHTML = `${b.guns[b.inventory[i]].name} - ${b.guns[b.inventory[i]].durability}/${b.guns[b.inventory[i]].maxDurability} <em style="font-size: 20px;">durability</em>`;
                            }
                        }
                    }
                });
            }

            this.cycle2++;
            this.durability = Math.max(0, Math.min(this.durability, this.maxDurability));

            if (b.activeGun !== null && input.fire && (tech.isEnergyHealth ? m.energy >= 0.11 : m.health >= 0.11) && this.durability > 0) {
                if (!this.hammer && b.guns[b.activeGun].name === 'pinkBlossomHammer') {
                    this.angle = m.angle;
                    ({ hammer: this.hammer, headSegments: this.headSegments } = this.createAndSwingHammer());
                    if(tech.isEnergyHealth) {
                        m.energy -= 0.05;
                    } else {
                        m.health -= 0.05;
                        m.displayHealth();
                    }
                }
            }

            if (this.hammer && (!input.fire || this.durability <= 0)) {
                Composite.remove(engine.world, this.hammer);
                this.hammer.parts.forEach(part => {
                    Composite.remove(engine.world, part);
                });
                this.hammer = undefined;
                this.headTrails = [];
            }

            if (this.hammer) {
                if (!(this.angle > -Math.PI / 2 && this.angle < Math.PI / 2)) {
                    Matter.Body.setAngularVelocity(this.hammer, -Math.PI * 0.12);
                } else {
                    Matter.Body.setAngularVelocity(this.hammer, Math.PI * 0.12);
                }
                Matter.Body.setVelocity(this.hammer, {
                    x: Math.cos(this.angle) * 25,
                    y: Math.sin(this.angle) * 25
                });

                for (let i = 0; i < this.headSegments.length; i++) {
                    const head = this.headSegments[i];
                    const trail = this.headTrails[i] || [];
                    const vertices = head.vertices.map(v => ({ x: v.x, y: v.y }));
                    trail.push(vertices);
                    if (trail.length > 8) trail.shift();
                    this.headTrails[i] = trail;
                }

                for (let i = 0; i < this.headTrails.length; i++) {
                    const trail = this.headTrails[i];
                    const alphaStep = 1 / trail.length;
                    let alpha = 0;
                    for (let j = 0; j < trail.length; j++) {
                        const vertices = trail[j];
                        ctx.beginPath();
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let k = 1; k < vertices.length; k++) ctx.lineTo(vertices[k].x, vertices[k].y);
                        alpha += alphaStep;
                        ctx.closePath();
                        ctx.fillStyle = `rgba(255,182,193,${alpha})`;
                        ctx.fill();
                    }
                }

                for (let i = 0; i < this.headSegments.length; i++) {
                    ctx.beginPath();
                    ctx.lineJoin = "round";
                    ctx.strokeStyle = "#ff69b4";
                    ctx.lineWidth = 6;
                    ctx.fillStyle = "#ffe4e1";
                    ctx.moveTo(this.headSegments[i].vertices[0].x, this.headSegments[i].vertices[0].y);
                    for (let j = 0; j < this.headSegments[i].vertices.length; j++) {
                        ctx.lineTo(this.headSegments[i].vertices[j].x, this.headSegments[i].vertices[j].y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fill();
                }

                for (let i = 0; i < mob.length; i++) {
                    if (Matter.Query.collides(this.hammer, [mob[i]]).length > 0) {
                        if(tech.durabilityHammer) this.durability--;
                        const dmg = (m.damageDone ? m.damageDone : m.dmgScale) * 0.18 * 2.5;
                        mob[i].damage(dmg, true);
                        simulation.drawList.push({
                            x: mob[i].position.x,
                            y: mob[i].position.y,
                            radius: 60,
                            color: "#ffb6c1",
                            time: simulation.drawTime
                        });
                        for (let p = 0; p < 6; p++) {
                            simulation.drawList.push({
                                x: mob[i].position.x + Math.random() * 40 - 20,
                                y: mob[i].position.y + Math.random() * 40 - 20,
                                radius: 6 + Math.random() * 6,
                                color: "#ffc0cb",
                                time: simulation.drawTime
                            });
                        }
                        break;
                    }
                }
            }
        },
        createAndSwingHammer(x = player.position.x, y = player.position.y, angle = m.angle) {
            this.cycle = m.cycle + 60;
            const handle = Bodies.rectangle(x, y, 20, 120, spawn.propsIsNotHoldable);
            const head = Bodies.rectangle(x, y - 80, 100, 50, spawn.propsIsNotHoldable);
            bullet[bullet.length] = handle;
            bullet[bullet.length - 1].do = () => {};
            bullet[bullet.length] = head;
            bullet[bullet.length - 1].do = () => {};
            const hammer = Body.create({ parts: [handle, head] });
            Composite.add(engine.world, hammer);
            Matter.Body.setPosition(hammer, { x, y });
            Matter.Body.setVelocity(hammer, { x: 0, y: 0 });
            hammer.collisionFilter.category = cat.bullet;
            hammer.collisionFilter.mask = cat.mobBullet | cat.mob;
            if ((angle > -Math.PI / 2 && angle < Math.PI / 2)) Body.scale(hammer, -1, 1, { x, y });
            return { hammer, headSegments: [handle, head] };
        }
    };

    b.guns.push(e);
    const gunArray = b.guns.filter((obj, index, self) => index === self.findIndex(item => item.name === obj.name));
    b.guns = gunArray;
    console.log("%cPink Blossom Hammer mod successfully installed!", "color:#ff69b4");
})();
