
javascript:(function() {
    const e = {
        name: "dualGauntlets",
        descriptionFunction() {
            return `wield <b>dual gauntlets</b> that punch rapidly in melee combat<br>drains <strong class='color-h'>health</strong> instead of ammunition<br>doesn't use <b>ammo</b>`;
        },
        ammo: Infinity,
        ammoPack: Infinity,
        defaultAmmoPack: Infinity,
        have: false,
        cycle: 0,
        leftGauntlet: undefined,
        rightGauntlet: undefined,
        gauntletSegments: [],
        punchCooldown: 0,
        isPunching: false,
        punchSide: "left",
        haveEphemera: false,
        fire() {},
        do() {
            if(!this.haveEphemera) {
                this.haveEphemera = true;
                simulation.ephemera.push({
                    name: "dualGauntlets",
                    do() {
                        if(b.guns[b.activeGun].name !== 'dualGauntlets') {
                            for (let i = 0; i < b.inventory.length; i++) {
                                if(b.guns[b.inventory[i]].name === "dualGauntlets") {
                                    if(b.guns[b.inventory[i]].leftGauntlet) {
                                        Composite.remove(engine.world, b.guns[b.inventory[i]].leftGauntlet);
                                        b.guns[b.inventory[i]].leftGauntlet = undefined;
                                    }
                                    if(b.guns[b.inventory[i]].rightGauntlet) {
                                        Composite.remove(engine.world, b.guns[b.inventory[i]].rightGauntlet);
                                        b.guns[b.inventory[i]].rightGauntlet = undefined;
                                    }
                                    b.guns[b.inventory[i]].gauntletSegments = [];
                                }
                            }
                        }
                    }
                });
            }

            this.cycle++;

            if (input.fire && b.activeGun !== null && (tech.isEnergyHealth ? m.energy >= 0.05 : m.health >= 0.05)) {
                if (!this.leftGauntlet && !this.rightGauntlet && b.guns[b.activeGun].name === 'dualGauntlets') {
                    this.createGauntlets();
                }

                if (this.punchCooldown <= 0) {
                    this.isPunching = true;
                    this.punchCooldown = 8;
                    if(tech.isEnergyHealth) {
                        m.energy -= 0.002;
                    } else {
                        m.health -= 0.0005;
                        m.displayHealth();
                    }
                }
            }

            if (this.punchCooldown > 0) this.punchCooldown--;

            if (this.leftGauntlet && this.rightGauntlet) {
                const offset = this.isPunching ? 60 : 30;
                const activeGauntlet = this.punchSide === "left" ? this.leftGauntlet : this.rightGauntlet;
                const inactiveGauntlet = this.punchSide === "left" ? this.rightGauntlet : this.leftGauntlet;

                Matter.Body.setPosition(activeGauntlet, {
                    x: m.pos.x + Math.cos(m.angle) * offset,
                    y: m.pos.y + Math.sin(m.angle) * offset
                });

                Matter.Body.setPosition(inactiveGauntlet, {
                    x: m.pos.x + Math.cos(m.angle) * 20,
                    y: m.pos.y + Math.sin(m.angle) * 20
                });

                Matter.Body.setAngle(activeGauntlet, m.angle);
                Matter.Body.setAngle(inactiveGauntlet, m.angle);

                // Render gauntlets
                this.gauntletSegments.forEach(segment => {
                    ctx.beginPath();
                    ctx.moveTo(segment.vertices[0].x, segment.vertices[0].y);
                    for(let j = 1; j < segment.vertices.length; j++) {
                        ctx.lineTo(segment.vertices[j].x, segment.vertices[j].y);
                    }
                    ctx.closePath();
                    ctx.strokeStyle = tech.isEnergyHealth ? m.fieldMeterColor : "#8b4513";
                    ctx.lineWidth = 4;
                    ctx.fillStyle = "#444";
                    ctx.stroke();
                    ctx.fill();
                });

                // Collision detection
                for (let i = 0; i < mob.length; i++) {
                    if (Matter.Query.collides(activeGauntlet, [mob[i]]).length > 0) {
                        const dmg = (m.damageDone ? m.damageDone : m.dmgScale) * 0.08;
                        mob[i].damage(dmg, true);
                        simulation.drawList.push({
                            x: mob[i].position.x,
                            y: mob[i].position.y,
                            radius: 40,
                            color: simulation.mobDmgColor,
                            time: simulation.drawTime
                        });
                        this.punchSide = this.punchSide === "left" ? "right" : "left";
                        break;
                    }
                }

                if (this.isPunching && this.punchCooldown === 0) {
                    this.isPunching = false;
                    this.punchSide = this.punchSide === "left" ? "right" : "left";
                }
            }

            if (!input.fire && (this.leftGauntlet || this.rightGauntlet)) {
                if(this.leftGauntlet) {
                    Composite.remove(engine.world, this.leftGauntlet);
                    this.leftGauntlet = undefined;
                }
                if(this.rightGauntlet) {
                    Composite.remove(engine.world, this.rightGauntlet);
                    this.rightGauntlet = undefined;
                }
                this.gauntletSegments = [];
            }
        },
        createGauntlets() {
            const x = m.pos.x;
            const y = m.pos.y;

            // Left gauntlet
            const leftFist = Bodies.rectangle(x - 20, y, 30, 25, spawn.propsIsNotHoldable);
            const leftArm = Bodies.rectangle(x - 30, y, 15, 40, spawn.propsIsNotHoldable);
            this.leftGauntlet = Body.create({ parts: [leftFist, leftArm] });
            Composite.add(engine.world, this.leftGauntlet);
            this.leftGauntlet.collisionFilter.category = cat.bullet;
            this.leftGauntlet.collisionFilter.mask = cat.mob;

            // Right gauntlet
            const rightFist = Bodies.rectangle(x + 20, y, 30, 25, spawn.propsIsNotHoldable);
            const rightArm = Bodies.rectangle(x + 30, y, 15, 40, spawn.propsIsNotHoldable);
            this.rightGauntlet = Body.create({ parts: [rightFist, rightArm] });
            Composite.add(engine.world, this.rightGauntlet);
            this.rightGauntlet.collisionFilter.category = cat.bullet;
            this.rightGauntlet.collisionFilter.mask = cat.mob;

            this.gauntletSegments = [leftFist, leftArm, rightFist, rightArm];
        }
    };

    b.guns.push(e);
    const gunArray = b.guns.filter((obj, index, self) => index === self.findIndex(item => item.name === obj.name));
    b.guns = gunArray;
    console.log("%cDual Gauntlets mod successfully installed", "color: #8b4513");
})();
