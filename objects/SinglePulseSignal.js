class SinglePulseSignal {
    constructor(pulseHeightV, pulseLengthMs, delayMs) {
        this.pulseHeightV = pulseHeightV;
        this.pulseLengthMs = pulseLengthMs;
        this.delayMs = delayMs;

        this.pulseLowV = 0;

        this.isSender = false;

        this.values = null;
    }

    getSamplePoints(measurement) {
        if (this.values != null) {
            return this.values;
        }

        return SignalUtils.measure(measurement, this.getValueAtTime, {...this});
    }

    getValueAtTime(timeMs, refObject) {
        if (timeMs < refObject.delayMs) {
            return refObject.pulseLowV;
        }

        let startTime = timeMs - refObject.delayMs;

        return startTime < refObject.pulseLengthMs ?
            refObject.pulseHeightV : refObject.pulseLowV;
    }

    static generateFromStudent(student, isSender) {
        let pulseHeightV = student.katNr;
        let pulseLengthMs = 100 + 2 * student.katNr;

        let delayMs = 0;

        if (!isSender) {
            delayMs = 5 * pulseLengthMs;
        }

        let signal = new SinglePulseSignal(
            pulseHeightV, pulseLengthMs, delayMs
        );

        signal.isSender = isSender;

        return signal;
    }
}