class TrashGame {
    constructor() {
        this.initializeElements();
        this.initializeGameState();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.elements = {
            powerFill: document.getElementById('power-fill'),
            successCount: document.getElementById('success-count'),
            failureCount: document.getElementById('failure-count'),
            canSize: document.getElementById('can-size'),
            trashCan: document.getElementById('trash-can'),
            trashCanWrapper: document.getElementById('trash-can-wrapper'),
            player: document.getElementById('player'),
            armRight: document.getElementById('arm-right'),
            currentTrash: document.getElementById('current-trash'),
            trashPaper: document.getElementById('trash-paper'),
            trashApple: document.getElementById('trash-apple'),
            trashStone: document.getElementById('trash-stone'),
            flyingTrash: document.getElementById('flying-trash'),
            flyingPaper: document.getElementById('flying-paper'),
            flyingApple: document.getElementById('flying-apple'),
            flyingStone: document.getElementById('flying-stone'),
            bee: document.getElementById('bee'),
            beeStinger: document.getElementById('bee-stinger'),
            stingerProjectile: document.getElementById('stinger-projectile'),
            distanceDisplay: document.getElementById('distance-display'),
            throwDistance: document.getElementById('throw-distance'),
            gameOver: document.getElementById('game-over'),
            finalScore: document.getElementById('final-score'),
            restartBtn: document.getElementById('restart-btn'),
            trashTypes: document.querySelectorAll('.trash-type'),
            trashSelector: document.querySelector('.trash-selector')
        };
    }

    initializeGameState() {
        this.state = {
            successCount: 0,
            failureCount: 0,
            canSize: 1,
            currentTrashType: 'paper',
            isCharging: false,
            isThrowing: false,
            chargeStart: 0,
            power: 0,
            maxPower: 100,
            isGameOver: false,
            isBeeActive: false,
            isBeeAttacking: false,
            beeStartTime: 0,
            beeDuration: 12000,
            trashDistanceRatio: {
                paper: 2,
                apple: 4,
                stone: 8
            },
            targetDistance: 9,
            maxThrowDistance: 18,
            gameSceneWidth: 0
        };
    }

    bindEvents() {
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        this.elements.trashTypes.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchTrashType(btn.dataset.type);
            });
            btn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
        });

        this.elements.restartBtn.addEventListener('click', () => this.restartGame());

        window.addEventListener('resize', () => this.updateSceneWidth());
    }

    updateSceneWidth() {
        const scene = document.querySelector('.game-scene');
        if (scene) {
            this.state.gameSceneWidth = scene.offsetWidth - 200;
        }
    }

    handleMouseDown(e) {
        if (this.state.isGameOver || this.state.isThrowing) return;
        if (e.button !== 0) return;
        
        if (this.elements.trashSelector && this.elements.trashSelector.contains(e.target)) {
            return;
        }

        this.startCharging();
    }

    handleMouseUp(e) {
        if (this.state.isGameOver || !this.state.isCharging) return;
        if (e.button !== 0) return;
        
        this.stopChargingAndThrow();
    }

    handleTouchStart(e) {
        if (this.state.isGameOver || this.state.isThrowing) return;
        
        const touch = e.touches[0];
        if (this.elements.trashSelector && this.elements.trashSelector.contains(document.elementFromPoint(touch.clientX, touch.clientY))) {
            return;
        }

        e.preventDefault();
        this.startCharging();
    }

    handleTouchEnd(e) {
        if (this.state.isGameOver || !this.state.isCharging) return;
        e.preventDefault();
        
        this.stopChargingAndThrow();
    }

    startCharging() {
        this.state.isCharging = true;
        this.state.chargeStart = Date.now();
        this.updatePower();
    }

    stopChargingAndThrow() {
        this.state.isCharging = false;
        
        const currentPower = this.state.power;
        
        if (currentPower > 0) {
            this.throwTrash(currentPower);
        }
        
        this.state.power = 0;
        this.updatePowerBar();
    }

    updatePower() {
        if (!this.state.isCharging) return;

        const elapsed = Date.now() - this.state.chargeStart;
        this.state.power = Math.min(elapsed / 20, this.state.maxPower);
        
        this.updatePowerBar();

        if (this.state.power < this.state.maxPower) {
            requestAnimationFrame(() => this.updatePower());
        }
    }

    updatePowerBar() {
        const percentage = (this.state.power / this.state.maxPower) * 100;
        this.elements.powerFill.style.width = percentage + '%';
    }

    switchTrashType(type) {
        if (this.state.isThrowing) return;

        this.state.currentTrashType = type;

        this.elements.trashTypes.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        this.updateCurrentTrashDisplay();
    }

    updateCurrentTrashDisplay() {
        const type = this.state.currentTrashType;
        
        this.elements.trashPaper.style.display = type === 'paper' ? 'block' : 'none';
        this.elements.trashApple.style.display = type === 'apple' ? 'block' : 'none';
        this.elements.trashStone.style.display = type === 'stone' ? 'block' : 'none';
        
        this.elements.flyingPaper.style.display = type === 'paper' ? 'block' : 'none';
        this.elements.flyingApple.style.display = type === 'apple' ? 'block' : 'none';
        this.elements.flyingStone.style.display = type === 'stone' ? 'block' : 'none';
    }

    throwTrash(power) {
        this.state.isThrowing = true;

        this.elements.armRight.classList.add('throw');

        setTimeout(() => {
            this.launchTrash(power);
        }, 150);
    }

    launchTrash(power) {
        const ratio = this.state.trashDistanceRatio[this.state.currentTrashType];
        const powerFactor = power / this.state.maxPower;
        const throwDistance = powerFactor * this.state.maxThrowDistance * (ratio / 4);

        this.showDistance(throwDistance);

        this.animateTrashFlight(throwDistance);
    }

    showDistance(distance) {
        this.elements.throwDistance.textContent = distance.toFixed(1);
        this.elements.distanceDisplay.classList.add('show');

        setTimeout(() => {
            this.elements.distanceDisplay.classList.remove('show');
        }, 2500);
    }

    animateTrashFlight(distance) {
        const player = this.elements.player;
        const trashCan = this.elements.trashCan;
        
        const playerRect = player.getBoundingClientRect();
        const canRect = trashCan.getBoundingClientRect();
        
        const startX = playerRect.left + playerRect.width / 2 - 13;
        const startY = playerRect.top + 50;
        
        const targetPixelDistance = Math.abs(canRect.left - (playerRect.left + playerRect.width));
        const pixelsPerMeter = targetPixelDistance / this.state.targetDistance;
        const flightPixels = distance * pixelsPerMeter;
        
        const trash = this.elements.flyingTrash;
        trash.style.opacity = '1';
        trash.style.left = startX + 'px';
        trash.style.top = startY + 'px';
        trash.style.transition = 'none';
        trash.style.display = 'block';

        this.elements.currentTrash.style.opacity = '0';

        const duration = 700 + (distance * 40);
        const startTime = Date.now();
        
        const peakHeight = 80 + (distance * 20);
        const groundY = window.innerHeight - 80;

        let hitBee = false;
        let hitCan = false;
        let animationFinished = false;

        const sizeMultiplier = 1 + (this.state.canSize - 1) * 0.2;
        const canHalfWidth = (canRect.width / 2) * sizeMultiplier;
        const canHalfHeight = (canRect.height / 2) * sizeMultiplier;
        const canCenterX = canRect.left + canRect.width / 2;
        const canCenterY = canRect.top + canRect.height / 2;

        const checkCanCollision = (trashRect) => {
            const trashCenterX = trashRect.left + trashRect.width / 2;
            const trashCenterY = trashRect.top + trashRect.height / 2;
            
            const expandedLeft = canCenterX - canHalfWidth - 15;
            const expandedRight = canCenterX + canHalfWidth + 15;
            const expandedTop = canCenterY - canHalfHeight - 30;
            const expandedBottom = canCenterY + canHalfHeight + 10;
            
            return (trashCenterX >= expandedLeft && 
                    trashCenterX <= expandedRight && 
                    trashCenterY >= expandedTop && 
                    trashCenterY <= expandedBottom);
        };

        const quadraticParabola = (progress, start, peak, end) => {
            const midProgress = 0.4;
            
            if (progress <= midProgress) {
                const t = progress / midProgress;
                return start + (peak - start) * Math.sin(t * Math.PI / 2);
            } else {
                const t = (progress - midProgress) / (1 - midProgress);
                return peak + (end - peak) * t * t;
            }
        };

        const animate = () => {
            if (hitBee || hitCan || animationFinished) return;

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const endX = startX - flightPixels;
            const peakX = startX - flightPixels * 0.4;
            const peakY = startY - peakHeight;
            const endY = groundY;
            
            const currentX = quadraticParabola(progress, startX, peakX, endX);
            const currentY = quadraticParabola(progress, startY, peakY, endY);
            
            const clampedY = Math.min(currentY, groundY);
            
            trash.style.left = currentX + 'px';
            trash.style.top = clampedY + 'px';
            
            const rotation = progress * 1080;
            trash.style.transform = `rotate(${rotation}deg)`;

            const trashRect = trash.getBoundingClientRect();

            if (this.state.isBeeActive && !hitBee) {
                const beeRect = this.elements.bee.getBoundingClientRect();
                
                if (this.checkCollision(trashRect, beeRect)) {
                    hitBee = true;
                    this.hitBee();
                    this.finishThrow();
                    return;
                }
            }

            if (!hitCan) {
                if (checkCanCollision(trashRect)) {
                    hitCan = true;
                    this.handleSuccess();
                    this.finishThrow();
                    return;
                }
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                animationFinished = true;
                if (!hitCan && !hitBee) {
                    this.handleFailure();
                }
                this.finishThrow();
            }
        };

        animate();
    }

    checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }

    handleSuccess() {
        this.state.successCount++;
        this.elements.successCount.textContent = this.state.successCount;
        
        if (this.state.canSize > 1) {
            this.state.canSize = Math.max(1, this.state.canSize - 1);
            this.updateCanSize();
        }
    }

    handleFailure() {
        this.state.failureCount++;
        this.elements.failureCount.textContent = this.state.failureCount;
        
        if (this.state.canSize < 5) {
            this.state.canSize++;
            this.updateCanSize();
        }

        if (this.state.failureCount >= 8 && !this.state.isBeeActive) {
            this.spawnBee();
        }
    }

    updateCanSize() {
        this.elements.canSize.textContent = this.state.canSize;
        
        const scale = 1 + (this.state.canSize - 1) * 0.2;
        this.elements.trashCan.style.transform = `scale(${scale})`;
    }

    spawnBee() {
        this.state.isBeeActive = true;
        this.state.isBeeAttacking = true;
        this.state.beeStartTime = Date.now();
        
        const bee = this.elements.bee;
        const player = this.elements.player;
        const playerRect = player.getBoundingClientRect();
        const beeRect = bee.getBoundingClientRect();
        
        bee.style.opacity = '1';
        bee.classList.remove('active', 'attacking', 'flying-away');
        bee.style.right = '-60px';
        bee.style.top = '40%';
        bee.style.transition = 'none';
        
        void bee.offsetWidth;
        
        bee.classList.add('attacking');
        
        setTimeout(() => {
            if (this.state.isBeeActive && !this.state.isGameOver) {
                this.shootStinger();
            }
        }, 1500);
    }

    shootStinger() {
        if (!this.state.isBeeActive || this.state.isGameOver) return;
        
        const stinger = this.elements.stingerProjectile;
        const bee = this.elements.bee;
        const player = this.elements.player;
        
        const beeRect = bee.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
        
        stinger.style.display = 'block';
        stinger.style.left = (beeRect.left + 10) + 'px';
        stinger.style.top = (beeRect.top + 20) + 'px';
        stinger.style.opacity = '1';
        stinger.style.transition = 'none';
        
        void stinger.offsetWidth;
        
        const targetX = playerRect.left + playerRect.width / 2;
        const targetY = playerRect.top + playerRect.height / 2;
        
        stinger.style.transition = 'all 0.5s ease-in';
        stinger.style.left = targetX + 'px';
        stinger.style.top = targetY + 'px';
        
        setTimeout(() => {
            if (this.state.isBeeActive && !this.state.isGameOver) {
                player.classList.add('hurt');
                
                setTimeout(() => {
                    player.classList.remove('hurt');
                }, 500);
                
                this.startBeeFlyingAway();
            }
            
            stinger.style.opacity = '0';
            setTimeout(() => {
                stinger.style.display = 'none';
            }, 300);
        }, 500);
    }

    startBeeFlyingAway() {
        if (!this.state.isBeeActive) return;
        
        this.state.isBeeAttacking = false;
        const bee = this.elements.bee;
        
        bee.classList.remove('attacking');
        bee.classList.add('flying-away');
        
        setTimeout(() => {
            if (this.state.isBeeActive && !this.state.isGameOver) {
                this.gameOver();
            }
        }, 6000);
    }

    hitBee() {
        this.state.isBeeActive = false;
        this.state.isBeeAttacking = false;
        this.state.failureCount = 0;
        this.elements.failureCount.textContent = '0';
        
        const bee = this.elements.bee;
        bee.classList.remove('active', 'attacking', 'flying-away');
        bee.style.opacity = '0';
        bee.style.transition = 'opacity 0.3s ease';
        
        const stinger = this.elements.stingerProjectile;
        stinger.style.opacity = '0';
        stinger.style.display = 'none';
    }

    finishThrow() {
        this.elements.flyingTrash.style.opacity = '0';
        this.elements.currentTrash.style.opacity = '1';
        this.elements.armRight.classList.remove('throw');
        
        setTimeout(() => {
            this.state.isThrowing = false;
        }, 100);
    }

    gameOver() {
        this.state.isGameOver = true;
        this.elements.finalScore.textContent = this.state.successCount;
        this.elements.gameOver.classList.add('show');
    }

    restartGame() {
        this.initializeGameState();
        
        this.elements.successCount.textContent = '0';
        this.elements.failureCount.textContent = '0';
        this.elements.canSize.textContent = '1';
        this.elements.gameOver.classList.remove('show');
        this.elements.bee.classList.remove('active', 'attacking', 'flying-away');
        this.elements.bee.style.opacity = '0';
        this.elements.trashCan.style.transform = 'scale(1)';
        this.elements.stingerProjectile.style.display = 'none';
        this.elements.stingerProjectile.style.opacity = '0';
        
        this.switchTrashType('paper');
    }

    render() {
        this.updateCurrentTrashDisplay();
        this.updateSceneWidth();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TrashGame();
});
