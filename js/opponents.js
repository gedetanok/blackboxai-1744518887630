// AI-controlled opponent cars

class Opponent {
    constructor(position, color) {
        // Position and movement
        this.x = 0;
        this.y = 0;
        this.z = position * 100; // Stagger start positions
        this.speed = 0;
        
        // Car properties
        this.maxSpeed = 280 + (position * 5); // Faster cars start further back
        this.acceleration = 0.75;
        this.deceleration = -0.8;
        this.turnSpeed = 2.5;
        this.width = 40;
        
        // AI properties
        this.targetLane = 0;
        this.lookAhead = 20;
        this.color = color;
        this.sprite = `opponent${color}_straight`;
        
        // Race properties
        this.position = position + 2; // +2 because player is position 1
        this.lap = 1;
    }

    reset(position) {
        this.x = 0;
        this.y = 0;
        this.z = position * 100;
        this.speed = 0;
        this.position = position + 2;
        this.lap = 1;
    }

    update(dt) {
        // Get current segment
        const segment = road.findSegment(this.z);
        
        // Update position
        this.z += this.speed * dt;
        
        // Wrap around track
        if (this.z >= road.trackLength) {
            this.z -= road.trackLength;
            this.lap++;
        }
        
        // AI behavior
        this.think(segment);
        
        // Apply physics
        this.applyPhysics(dt, segment);
        
        // Update sprite
        this.updateSprite();
    }

    think(segment) {
        // Look ahead for obstacles
        const lookAheadSegment = road.segments[(segment.index + this.lookAhead) % road.segments.length];
        
        // Find nearby cars
        const nearbyOpponents = this.findNearbyOpponents();
        
        // Determine target lane
        this.targetLane = this.chooseTargetLane(segment, lookAheadSegment, nearbyOpponents);
        
        // Adjust speed and steering
        this.adjustSpeedAndSteering(segment, nearbyOpponents);
    }

    findNearbyOpponents() {
        const nearby = [];
        
        // Check player
        const playerDist = Math.abs(player.z - this.z);
        if (playerDist < 300) {
            nearby.push({
                x: player.x,
                z: player.z,
                speed: player.speed,
                isPlayer: true
            });
        }
        
        // Check other opponents
        opponents.cars.forEach(car => {
            if (car !== this) {
                const dist = Math.abs(car.z - this.z);
                if (dist < 300) {
                    nearby.push({
                        x: car.x,
                        z: car.z,
                        speed: car.speed,
                        isPlayer: false
                    });
                }
            }
        });
        
        return nearby;
    }

    chooseTargetLane(segment, lookAheadSegment, nearbyOpponents) {
        // Default to center lane
        let targetLane = 0;
        
        // Move to inside of curves
        if (Math.abs(segment.curve) > 0.5) {
            targetLane = segment.curve > 0 ? -1 : 1;
        }
        
        // Avoid nearby cars
        nearbyOpponents.forEach(car => {
            const lateralDist = Math.abs(car.x - this.x);
            const longitudinalDist = car.z - this.z;
            
            if (lateralDist < 100 && longitudinalDist > 0 && longitudinalDist < 200) {
                // Move to opposite lane of obstacle
                targetLane = car.x > this.x ? -1 : 1;
            }
        });
        
        return targetLane;
    }

    adjustSpeedAndSteering(segment, nearbyOpponents) {
        // Base target speed on position and curve
        let targetSpeed = this.maxSpeed * (1 - Math.abs(segment.curve) * 0.3);
        
        // Reduce speed when near other cars
        nearbyOpponents.forEach(car => {
            const lateralDist = Math.abs(car.x - this.x);
            const longitudinalDist = car.z - this.z;
            
            if (lateralDist < 50 && longitudinalDist > 0 && longitudinalDist < 150) {
                targetSpeed *= 0.9;
            }
        });
        
        // Accelerate/decelerate towards target speed
        if (this.speed < targetSpeed) {
            this.speed = Math.min(targetSpeed, this.speed + this.acceleration);
        } else {
            this.speed = Math.max(targetSpeed, this.speed + this.deceleration);
        }
        
        // Steer towards target lane
        const targetX = this.targetLane * (road.roadWidth / 3);
        const steerAmount = this.turnSpeed * (this.speed/this.maxSpeed);
        
        if (this.x < targetX - 10) {
            this.x += steerAmount;
        } else if (this.x > targetX + 10) {
            this.x -= steerAmount;
        }
        
        // Apply centrifugal force in curves
        this.x += (segment.curve * 0.3) * (this.speed/this.maxSpeed);
        
        // Clamp to road bounds
        const roadWidth = road.roadWidth * 0.9;
        this.x = utils.clamp(this.x, -roadWidth, roadWidth);
    }

    applyPhysics(dt, segment) {
        // Apply gravity on hills
        const gravity = 0.0025;
        this.y = segment.world.p1.y + (this.speed * gravity * dt);
        
        // Ground friction
        this.speed *= 0.99;
        
        // Air resistance
        this.speed *= (1 - (this.speed * 0.0001));
    }

    updateSprite() {
        // Update sprite based on steering
        const steerThreshold = 0.5;
        if (this.x < this.targetX - steerThreshold) {
            this.sprite = `opponent${this.color}_left`;
        } else if (this.x > this.targetX + steerThreshold) {
            this.sprite = `opponent${this.color}_right`;
        } else {
            this.sprite = `opponent${this.color}_straight`;
        }
    }
}

class OpponentManager {
    constructor() {
        this.cars = [];
        this.colors = ['1', '2', '3'];
    }

    init(count) {
        this.cars = [];
        for(let i = 0; i < count; i++) {
            const color = this.colors[i % this.colors.length];
            this.cars.push(new Opponent(i, color));
        }
    }

    reset() {
        this.cars.forEach((car, i) => car.reset(i));
    }

    update(dt) {
        this.cars.forEach(car => car.update(dt));
    }
}

// Create and export opponents manager
window.opponents = new OpponentManager();
