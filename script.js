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
            distanceDisplay: document.getElementById('distance-display'),
            throwDistance: document.getElementById('throw-distance'),
            gameOver: document.getElementById('game-over'),
            finalScore: document.getElementById('final-score'),
            restartBtn: document.getElementById('restart-btn'),
            trashTypes: document.querySelectorAll('.trash-type')
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
            beeStartTime: 0,
            beeDuration: 10000,
            trashDistanceRatio: {
                paper: 2,
                apple: 4,
                stone: 8
            },
            targetDistance: 9,
            gameSceneWidth: 0
        };
    }

    bindEvents() {
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        this.elements.trashTypes.forEach(btn => {
            btn.addEventListener('click', () => this.switchTrashType(btn.dataset.type));
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
        
        this.startCharging();
    }

    handleMouseUp(e) {
        if (this.state.isGameOver || !this.state.isCharging) return;
        if (e.button !== 0) return;
        
        this.stopChargingAndThrow();
    }

    handleTouchStart(e) {
        if (this.state.isGameOver || this.state.isThrowing) return;
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
        
        if (this.state.power > 0) {
            this.throwTrash();
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

    throwTrash() {
        this.state.isThrowing = true;

        this.elements.armRight.classList.add('throw');

        setTimeout(() => {
            this.launchTrash();
        }, 150);
    }

    launchTrash() {
        const ratio = this.state.trashDistanceRatio[this.state.currentTrashType];
        const powerFactor = this.state.power / this.state.maxPower;
        const throwDistance = (powerFactor * 10) * (ratio / 4);

        this.showDistance(throwDistance);

        this.animateTrashFlight(throwDistance);
    }

    showDistance(distance) {
        this.elements.throwDistance.textContent = distance.toFixed(1);
        this.elements.distanceDisplay.classList.add('show');

        setTimeout(() => {
            this.elements.distanceDisplay.classList.remove('show');
        }, 2000);
    }

    animateTrashFlight(distance) {
        this.updateSceneWidth();
        
        const sceneWidth = this.state.gameSceneWidth;
        const player = this.elements.player;
        const trashCan = this.elements.trashCan;
        
        const playerRect = player.getBoundingClientRect();
        const canRect = trashCan.getBoundingClientRect();
        
        const startX = playerRect.left + playerRect.width / 2 - 13;
        const startY = playerRect.top + 50;
        
        const pixelsPerMeter = (canRect.left - playerRect.right) / this.state.targetDistance;
        const flightPixels = distance * pixelsPerMeter;
        
        const endX = startX - flightPixels;
        const groundY = window.innerHeight - 80;
        
        const trash = this.elements.flyingTrash;
        trash.style.opacity = '1';
        trash.style.left = startX + 'px';
        trash.style.top = startY + 'px';
        trash.style.transition = 'none';
        trash.style.display = 'block';

        this.elements.currentTrash.style.opacity = '0';

        const duration = 800;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentX = startX - (flightPixels * progress);
            
            const peakHeight = 200;
            const currentY = startY - (peakHeight * Math.sin(progress * Math.PI)) + 
                             (progress * progress * (groundY - startY + peakHeight));
            
            trash.style.left = currentX + 'px';
            trash.style.top = currentY + 'px';
            
            const rotation = progress * 720;
            trash.style.transform = `rotate(${rotation}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.checkHit(distance, endX, currentY);
            }
        };

        animate();
    }

    checkHit(distance, endX, endY) {
        const scene = document.querySelector('.game-scene');
        const canRect = this.elements.trashCan.getBoundingClientRect();
        
        const tolerance = 1.5 + (this.state.canSize - 1) * 0.8;
        
        const distanceDiff = Math.abs(distance - this.state.targetDistance);
        
        let hit = false;
        
        if (distanceDiff <= tolerance) {
            const trashRect = this.elements.flyingTrash.getBoundingClientRect();
            
            const trashCenterX = trashRect.left + trashRect.width / 2;
            const trashCenterY = trashRect.top + trashRect.height / 2;
            
            const canCenterX = canRect.left + canRect.width / 2;
            const canTopY = canRect.top;
            const canBottomY = canRect.bottom;
            const canLeftX = canRect.left;
            const canRightX = canRect.right;
            
            const sizeMultiplier = 1 + (this.state.canSize - 1) * 0.2;
            const expandedLeft = canCenterX - (canRect.width / 2) * sizeMultiplier;
            const expandedRight = canCenterX + (canRect.width / 2) * sizeMultiplier;
            const expandedTop = canTopY - 20;
            const expandedBottom = canBottomY + 20;
            
            if (trashCenterX >= expandedLeft && 
                trashCenterX <= expandedRight && 
                trashCenterY >= expandedTop && 
                trashCenterY <= expandedBottom) {
                hit = true;
            }
        }

        if (this.state.isBeeActive) {
            const beeRect = this.elements.bee.getBoundingClientRect();
            const trashRect = this.elements.flyingTrash.getBoundingClientRect();
            
            if (this.checkCollision(trashRect, beeRect)) {
                this.hitBee();
            }
        }

        if (hit) {
            this.handleSuccess();
        } else {
            this.handleFailure();
        }

        this.finishThrow();
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
        this.state.beeStartTime = Date.now();
        
        this.elements.bee.classList.add('active');

        setTimeout(() => {
            if (this.state.isBeeActive && !this.state.isGameOver) {
                this.gameOver();
            }
        }, this.state.beeDuration);
    }

    hitBee() {
        this.state.isBeeActive = false;
        this.state.failureCount = 0;
        this.elements.failureCount.textContent = '0';
        this.elements.bee.classList.remove('active');
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
        this.elements.bee.classList.remove('active');
        this.elements.trashCan.style.transform = 'scale(1)';
        
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
