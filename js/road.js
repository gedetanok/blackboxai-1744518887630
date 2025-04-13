// Road system for handling track segments and rendering

class Road {
    constructor() {
        // Road properties
        this.segments = [];
        this.segmentLength = 200;
        this.roadWidth = 2000;
        this.trackLength = 0;
        
        // Road colors
        this.colors = {
            light: { road: '#888', grass: '#28b520', rumble: '#b72e3e' },
            dark: { road: '#666', grass: '#24a51c', rumble: '#b72e3e' }
        };
        
        // Lane markers
        this.lanes = 3;
        this.laneMarkerWidth = 10;
    }

    reset() {
        this.segments = [];
        this.trackLength = 0;
    }

    addSegment(curve = 0, y = 0) {
        const n = this.segments.length;
        const z = n * this.segmentLength;
        
        const segment = {
            index: n,
            curve: curve,
            world: {
                p1: { x: -this.roadWidth, y: y, z: z },
                p2: { x: this.roadWidth, y: y, z: z },
                p3: { x: this.roadWidth, y: y, z: z + this.segmentLength },
                p4: { x: -this.roadWidth, y: y, z: z + this.segmentLength }
            },
            color: Math.floor(n/3) % 2 ? this.colors.dark : this.colors.light,
            objects: []
        };
        
        this.segments.push(segment);
        this.trackLength = (n + 1) * this.segmentLength;
        return segment;
    }

    addSegments(n, curve, y) {
        for(let i = 0; i < n; i++) {
            this.addSegment(curve, y);
        }
    }

    addCurve(n, curve) {
        this.addSegments(n, curve);
    }

    addHill(n, height) {
        const startY = this.lastY();
        for(let i = 0; i < n; i++) {
            const y = startY + Math.sin(i * Math.PI/n) * height;
            this.addSegment(0, y);
        }
    }

    addStraight(n) {
        this.addSegments(n, 0);
    }

    lastY() {
        return this.segments.length === 0 ? 0 : this.segments[this.segments.length-1].world.p1.y;
    }

    findSegment(z) {
        const index = Math.floor(z/this.segmentLength) % this.segments.length;
        return this.segments[index];
    }

    addObject(n, sprite, offset) {
        const segment = this.segments[n];
        if (segment) {
            segment.objects.push({
                sprite: sprite,
                offset: offset
            });
        }
    }

    renderSegment(ctx, segment, width, height) {
        const r1 = segment.p1;
        const r2 = segment.p2;
        const l1 = segment.p3;
        const l2 = segment.p4;
        
        if (segment.clip) return;

        // Draw grass
        ctx.fillStyle = segment.color.grass;
        ctx.fillRect(0, r1.y, width, l2.y - r1.y);

        // Draw road
        ctx.fillStyle = segment.color.road;
        ctx.beginPath();
        ctx.moveTo(r1.x, r1.y);
        ctx.lineTo(r2.x, r2.y);
        ctx.lineTo(l2.x, l2.y);
        ctx.lineTo(l1.x, l1.y);
        ctx.closePath();
        ctx.fill();

        // Draw rumble strips
        const rumbleWidth = this.roadWidth/5;
        ctx.fillStyle = segment.color.rumble;
        
        // Left rumble
        ctx.beginPath();
        ctx.moveTo(r1.x-rumbleWidth, r1.y);
        ctx.lineTo(r1.x, r1.y);
        ctx.lineTo(l1.x, l1.y);
        ctx.lineTo(l1.x-rumbleWidth, l1.y);
        ctx.closePath();
        ctx.fill();
        
        // Right rumble
        ctx.beginPath();
        ctx.moveTo(r2.x+rumbleWidth, r2.y);
        ctx.lineTo(r2.x, r2.y);
        ctx.lineTo(l2.x, l2.y);
        ctx.lineTo(l2.x+rumbleWidth, l2.y);
        ctx.closePath();
        ctx.fill();

        // Draw lane markers
        if (!segment.color.lane && Math.floor(segment.index/3) % 2) {
            const laneDist = this.roadWidth/this.lanes;
            const lineWidth = this.laneMarkerWidth * segment.p1.w;
            ctx.fillStyle = '#fff';
            
            for(let i = 1; i < this.lanes; i++) {
                const x = r1.x + (laneDist * i);
                const w = lineWidth * 2;
                ctx.fillRect(x-w/2, r1.y, w, l1.y-r1.y);
            }
        }

        // Apply fog
        if (segment.fog) {
            ctx.globalAlpha = 1 - segment.fog;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, r1.y, width, l2.y - r1.y);
            ctx.globalAlpha = 1;
        }
    }

    renderObjects(ctx, segment, width, height) {
        if (segment.clip) return;

        const scale = camera.getScaling(segment.p1.z);
        
        segment.objects.forEach(object => {
            const spriteX = segment.p1.x + (segment.p2.x - segment.p1.x) * (object.offset + 1)/2;
            const spriteY = segment.p1.y;
            
            graphics.drawSprite(
                ctx,
                object.sprite,
                spriteX,
                spriteY,
                scale
            );
        });
    }

    project(playerX, playerZ, cameraDepth) {
        if (!this.segments.length) return;
        
        for(let n = 0; n < this.segments.length; n++) {
            const segment = this.segments[n];
            camera.projectSegment(segment, camera.screen.width, camera.screen.height);
            
            if (segment.curve !== 0 && segment.p1.z <= cameraDepth) {
                const curve = segment.curve * (segment.p1.z/cameraDepth);
                segment.p1.x += curve;
                segment.p2.x += curve;
            }
        }
    }
}

// Create and export road instance
window.road = new Road();
