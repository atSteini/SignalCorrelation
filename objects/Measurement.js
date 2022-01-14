class Measurement {
    constructor(sampleIntervalMs, measureTimeMs) {
        this.sampleIntervalMs = sampleIntervalMs;
        this.measureTimeMs = measureTimeMs;

        this.highestHarmonic = null;
        this.frequencyResolutionKHz = null;
    }
}