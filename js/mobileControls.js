
// Mobile Controls with Virtual Joystick - Optimized for mobile gameplay
(function() {
    'use strict';
    
    const mobileControls = {
        enabled: true,
        joystick: {
            active: false,
            baseX: 100,
            baseY: 500,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            maxRadius: 60,
            deadzone: 10
        },
        fireButton: {
            active: false,
            x: 0,
            y: 0,
            radius: 50
        },
        fieldButton: {
            active: false,
            x: 0,
            y: 0,
            radius: 45
        },
        jumpButton: {
            active: false,
            x: 0,
            y: 0,
            radius: 40
        },
        gunSwitchButtons: {
            left: { active: false, x: 0, y: 0 },
            right: { active: false, x: 0, y: 0 }
        },
        touchIds: {},
        
        init() {
            // Always enable on mobile or desktop for testing
            this.enabled = true;
            
            // Position buttons
            this.positionButtons();
            
            // Touch event listeners
            canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
            
            // Also support mouse for desktop testing
            canvas.addEventListener('mousedown', this.handleTouchStart.bind(this), { passive: false });
            canvas.addEventListener('mousemove', this.handleTouchMove.bind(this), { passive: false });
            canvas.addEventListener('mouseup', this.handleTouchEnd.bind(this), { passive: false });
            
            // Prevent default touch behaviors
            document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
            
            console.log('%cMobile controls initialized (full integration)', 'color: #0cf; font-weight: bold');
        },
        
        positionButtons() {
            const w = canvas.width;
            const h = canvas.height;
            
            // Joystick area (bottom left)
            this.joystick.baseX = 100;
            this.joystick.baseY = h - 100;
            
            // Fire button (bottom right)
            this.fireButton.x = w - 80;
            this.fireButton.y = h - 80;
            
            // Field button (right side, middle)
            this.fieldButton.x = w - 80;
            this.fieldButton.y = h - 180;
            
            // Jump button (right side, upper)
            this.jumpButton.x = w - 80;
            this.jumpButton.y = h - 280;
            
            // Gun switch buttons (top)
            this.gunSwitchButtons.left.x = 60;
            this.gunSwitchButtons.left.y = 60;
            this.gunSwitchButtons.right.x = 140;
            this.gunSwitchButtons.right.y = 60;
        },
        
        handleTouchStart(e) {
            e.preventDefault();
            
            const touches = e.changedTouches || [{ clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }];
            
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const x = touch.clientX;
                const y = touch.clientY;
                
                // Check joystick
                const joyDist = Math.hypot(x - this.joystick.baseX, y - this.joystick.baseY);
                if (joyDist < 120) {
                    this.joystick.active = true;
                    this.joystick.startX = x;
                    this.joystick.startY = y;
                    this.joystick.currentX = x;
                    this.joystick.currentY = y;
                    this.touchIds[touch.identifier] = 'joystick';
                    continue;
                }
                
                // Check fire button
                if (Math.hypot(x - this.fireButton.x, y - this.fireButton.y) < this.fireButton.radius) {
                    this.fireButton.active = true;
                    this.touchIds[touch.identifier] = 'fire';
                    input.fire = true;
                    continue;
                }
                
                // Check field button
                if (Math.hypot(x - this.fieldButton.x, y - this.fieldButton.y) < this.fieldButton.radius) {
                    this.fieldButton.active = true;
                    this.touchIds[touch.identifier] = 'field';
                    input.field = true;
                    continue;
                }
                
                // Check jump button
                if (Math.hypot(x - this.jumpButton.x, y - this.jumpButton.y) < this.jumpButton.radius) {
                    this.jumpButton.active = true;
                    this.touchIds[touch.identifier] = 'jump';
                    input.up = true;
                    continue;
                }
                
                // Check gun switch buttons
                if (Math.hypot(x - this.gunSwitchButtons.left.x, y - this.gunSwitchButtons.left.y) < 35) {
                    b.switchGun(-1);
                    continue;
                }
                if (Math.hypot(x - this.gunSwitchButtons.right.x, y - this.gunSwitchButtons.right.y) < 35) {
                    b.switchGun(1);
                    continue;
                }
            }
        },
        
        handleTouchMove(e) {
            e.preventDefault();
            
            const touches = e.changedTouches || [{ clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }];
            
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const action = this.touchIds[touch.identifier];
                
                if (action === 'joystick') {
                    this.joystick.currentX = touch.clientX;
                    this.joystick.currentY = touch.clientY;
                }
            }
        },
        
        handleTouchEnd(e) {
            e.preventDefault();
            
            const touches = e.changedTouches || [{ clientX: e.clientX, clientY: e.clientY, identifier: 'mouse' }];
            
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                const action = this.touchIds[touch.identifier];
                
                if (action === 'joystick') {
                    this.joystick.active = false;
                    input.left = false;
                    input.right = false;
                    input.down = false;
                } else if (action === 'fire') {
                    this.fireButton.active = false;
                    input.fire = false;
                } else if (action === 'field') {
                    this.fieldButton.active = false;
                    input.field = false;
                } else if (action === 'jump') {
                    this.jumpButton.active = false;
                    input.up = false;
                }
                
                delete this.touchIds[touch.identifier];
            }
        },
        
        update() {
            if (this.joystick.active) {
                const dx = this.joystick.currentX - this.joystick.baseX;
                const dy = this.joystick.currentY - this.joystick.baseY;
                const distance = Math.hypot(dx, dy);
                
                if (distance > this.joystick.deadzone) {
                    const angle = Math.atan2(dy, dx);
                    const magnitude = Math.min(distance, this.joystick.maxRadius) / this.joystick.maxRadius;
                    
                    // Horizontal movement
                    if (Math.abs(Math.cos(angle)) > 0.3) {
                        input.left = Math.cos(angle) < 0;
                        input.right = Math.cos(angle) > 0;
                    } else {
                        input.left = false;
                        input.right = false;
                    }
                    
                    // Crouch
                    input.down = Math.sin(angle) > 0.5 && magnitude > 0.5;
                }
            }
        },
        
        draw() {
            if (!this.enabled) return;
            
            // Save canvas state and reset transforms to draw in screen space
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 0.5;
            
            // Draw joystick base
            ctx.beginPath();
            ctx.arc(this.joystick.baseX, this.joystick.baseY, this.joystick.maxRadius, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw joystick stick
            if (this.joystick.active) {
                const dx = this.joystick.currentX - this.joystick.baseX;
                const dy = this.joystick.currentY - this.joystick.baseY;
                const distance = Math.min(Math.hypot(dx, dy), this.joystick.maxRadius);
                const angle = Math.atan2(dy, dx);
                
                ctx.beginPath();
                ctx.arc(
                    this.joystick.baseX + Math.cos(angle) * distance,
                    this.joystick.baseY + Math.sin(angle) * distance,
                    30, 0, Math.PI * 2
                );
                ctx.fillStyle = '#00ccff';
                ctx.fill();
            }
            
            // Draw fire button
            ctx.beginPath();
            ctx.arc(this.fireButton.x, this.fireButton.y, this.fireButton.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.fireButton.active ? '#ff4444' : '#ff0000';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw field button
            ctx.beginPath();
            ctx.arc(this.fieldButton.x, this.fieldButton.y, this.fieldButton.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.fieldButton.active ? '#44ff44' : '#00ff00';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw jump button
            ctx.beginPath();
            ctx.arc(this.jumpButton.x, this.jumpButton.y, this.jumpButton.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.jumpButton.active ? '#4444ff' : '#0000ff';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw gun switch buttons
            ctx.beginPath();
            ctx.arc(this.gunSwitchButtons.left.x, this.gunSwitchButtons.left.y, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#ffaa00';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(this.gunSwitchButtons.right.x, this.gunSwitchButtons.right.y, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#ffaa00';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
            
            ctx.restore();
        }
    };
    
    // Initialize on load
    window.addEventListener('load', () => {
        mobileControls.init();
    });
    
    // Add to simulation ephemera for continuous updates
    simulation.ephemera.push({
        name: 'mobileControls',
        do() {
            mobileControls.update();
            mobileControls.draw();
        }
    });
})();
