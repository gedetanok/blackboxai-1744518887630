// Camera system for handling game perspective

class Camera {
    constructor() {
        // Camera position
        this.x = 0;
        this.y = 1000;
        this.z = 0;
        
        // Camera angle
        this.rotation = 0;
        this.pitch = 100;
        
        // View distance
        this.distanceToPlayer = 500;
        this.playerY = 500;
        this.drawDistance = 3000;
        this.fogDensity = 0.0025;
        
        // Screen dimensions
        this.screen = {
            width: 0,
            height: 0,
            scale: 0
        };
        
        // Field of view
        this.fov = 100;
        this.viewDepth = 1 / Math.tan((this.fov/2) * Math.PI/180);
    }

    // Initialize camera with screen dimensions
    init(width, height) {
        this.screen.width = width;
        this.screen.height = height;
        this.screen.scale = height / 480; // Base scale on height
        
        // Reset camera position
        this.x = 0;
        this.y = 1000;
        this.z = 0;
        this.rotation = 0;
        
        // Update view depth based on screen dimensions
        this.viewDepth = (height / 2) / Math.tan((this.fov/2) * Math.PI/180);
    }

    // Update camera position to follow player
    follow(playerX, playerY, playerZ, playerSegment) {
        // Calculate target position
        const targetX = playerX;
        const targetY = this.playerY + playerY;
        const targetZ = playerZ - this.distanceToPlayer;

        // Smoothly move camera
        this.x = utils.lerp(this.x, targetX, 0.1);
        this.y = utils.lerp(this.y, targetY, 0.1);
        this.z = targetZ;

        // Update rotation based on road
        if (playerSegment) {
            const targetRotation = -playerSegment.curve * 0.13;
            this.rotation = utils.lerp(this.rotation, targetRotation, 0.1);
        }
    }

    // Project 3D world position to 2D screen position
    project(point3d, width, height) {
        // Convert world coordinates to camera space
        let transX = point3d.x - this.x;
        let transY = point3d.y - this.y;
        let transZ = point3d.z - this.z;
        
        // Ensure minimum z distance to prevent division by zero
        transZ = Math.max(transZ, 0.1);

        // Rotate point around camera
        const rotX = transX * Math.cos(this.rotation) - transZ * Math.sin(this.rotation);
        const rotZ = transX * Math.sin(this.rotation) + transZ * Math.cos(this.rotation);

        // Project to 2D
        const scale = this.viewDepth / rotZ;

        const point2d = {
            x: Math.round((width/2) + (rotX * scale * width/2)),
            y: Math.round((height/2) - (transY * scale * height/2)),
            w: Math.round(scale * this.screen.scale),
            z: rotZ
        };

        return point2d;
    }

    // Check if a point is behind the camera
    isBackfaced(z) {
        return z <= this.z;
    }

    // Calculate fog factor for a given z position
    calculateFog(z) {
        const distance = z - this.z;
        return utils.exponentialFog(distance, this.fogDensity);
    }

    // Project world segment to screen coordinates
    projectSegment(segment, width, height) {
        // Project segment points
        segment.p1 = this.project(segment.world.p1, width, height);
        segment.p2 = this.project(segment.world.p2, width, height);
        segment.p3 = this.project(segment.world.p3, width, height);
        segment.p4 = this.project(segment.world.p4, width, height);

        // Calculate segment properties
        segment.clip = segment.p1.z <= this.z || segment.p2.z <= this.z;
        
        // Calculate fog for segment
        if (!segment.clip) {
            const midZ = (segment.p1.z + segment.p2.z + segment.p3.z + segment.p4.z) / 4;
            segment.fog = this.calculateFog(midZ);
        }
    }

    // Get screen Y coordinate for sprite scaling
    getScreenY(worldY, height) {
        return (height/2) - (((worldY - this.y) / this.viewDepth) * height/2);
    }

    // Calculate scaling factor for sprites at given z position
    getScaling(z) {
        const depth = (z - this.z) * this.viewDepth;
        return this.screen.scale / Math.max(1, depth);
    }

    // Shake camera (for collisions, etc)
    shake(intensity = 1) {
        const shakeX = (Math.random() - 0.5) * intensity;
        const shakeY = (Math.random() - 0.5) * intensity;
        
        this.x += shakeX;
        this.y += shakeY;
        
        // Reset after shake
        setTimeout(() => {
            this.x -= shakeX;
            this.y -= shakeY;
        }, 50);
    }
}

// Create and export camera instance
window.camera = new Camera();
