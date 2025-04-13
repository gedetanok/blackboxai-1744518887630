// Track definitions and generation

class Track {
    constructor() {
        this.currentTrack = 0;
        this.tracks = [
            {
                name: "Countryside Sprint",
                description: "A scenic route through rolling hills",
                segments: [
                    { type: 'straight', length: 50 },
                    { type: 'curve', length: 50, curve: 1 },
                    { type: 'hill', length: 30, height: 100 },
                    { type: 'curve', length: 50, curve: -1 },
                    { type: 'straight', length: 30 },
                    { type: 'curve', length: 25, curve: 2 },
                    { type: 'straight', length: 50 },
                    { type: 'curve', length: 50, curve: -2 },
                    { type: 'straight', length: 30 },
                    { type: 'hill', length: 20, height: -50 }
                ],
                scenery: {
                    frequency: 0.2,
                    objects: ['tree', 'mountain']
                },
                backgroundColor: '#87CEEB', // Sky blue
                fogColor: '#FFFFFF'
            },
            {
                name: "City Nights",
                description: "Navigate through neon-lit streets",
                segments: [
                    { type: 'straight', length: 30 },
                    { type: 'curve', length: 25, curve: -1 },
                    { type: 'straight', length: 40 },
                    { type: 'curve', length: 50, curve: 1 },
                    { type: 'straight', length: 30 },
                    { type: 'curve', length: 25, curve: -2 },
                    { type: 'straight', length: 40 },
                    { type: 'curve', length: 25, curve: 2 },
                    { type: 'straight', length: 40 },
                    { type: 'curve', length: 25, curve: -1 }
                ],
                scenery: {
                    frequency: 0.3,
                    objects: ['building']
                },
                backgroundColor: '#1a1a1a', // Dark night
                fogColor: '#000000'
            }
        ];
    }

    // Generate track segments based on track definition
    generate(trackIndex) {
        this.currentTrack = trackIndex;
        const track = this.tracks[trackIndex];
        
        // Reset road and ensure we have segments
        road.reset();
        if (!track) return;
        
        // Generate segments
        track.segments.forEach(segment => {
            switch(segment.type) {
                case 'straight':
                    this.addStraight(segment.length);
                    break;
                case 'curve':
                    this.addCurve(segment.length, segment.curve);
                    break;
                case 'hill':
                    this.addHill(segment.length, segment.height);
                    break;
            }
        });
        
        // Add scenery
        this.addScenery(track);
        
        // Return true if track was generated successfully
        return true;
    }

    // Add straight section
    addStraight(length) {
        road.addStraight(length);
    }

    // Add curved section
    addCurve(length, curve) {
        road.addCurve(length, curve);
    }

    // Add hill section
    addHill(length, height) {
        road.addHill(length, height);
    }

    // Add trackside scenery
    addScenery(track) {
        const totalSegments = road.segments.length;
        
        for(let n = 0; n < totalSegments; n++) {
            // Add random scenery based on frequency
            if (Math.random() < track.scenery.frequency) {
                const object = track.scenery.objects[
                    Math.floor(Math.random() * track.scenery.objects.length)
                ];
                
                // Add to both sides of the road
                road.addObject(n, object, -1.2 - Math.random() * 0.8); // Left side
                road.addObject(n, object, 1.2 + Math.random() * 0.8);  // Right side
            }
        }
    }

    // Get current track info
    getCurrentTrack() {
        return this.tracks[this.currentTrack];
    }

    // Reset to first track
    reset() {
        this.currentTrack = 0;
        this.generate(0);
    }

    // Advance to next track
    nextTrack() {
        this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
        this.generate(this.currentTrack);
    }

    // Check if all tracks are complete
    isComplete() {
        return this.currentTrack >= this.tracks.length - 1;
    }
}

// Create and export track manager
window.track = new Track();
