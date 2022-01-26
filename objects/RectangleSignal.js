class RectangleSignal {
    constructor(periodMs, low, high, onTimePercent) {
        this.periodMS = periodMs;   //ms
        this.low = low; //V
        this.high = high;   //V
        this.dutyCycle = onTimePercent / 100.0;   // % / 100
        this.initialValue = true; //starting Low (false) or High (true)

        this.onTimeMs = periodMs * (onTimePercent / 100);
        this.offTimeMs = periodMs * (1 - (onTimePercent / 100));

        this.values = null;
    }

    getSamplePoints(measurement) {
        if (this.values) {
            return this.values;
        }

        return SignalUtils.measure(measurement, this.getValueAtTime, {...this});

        /*let retValues = [];
        let retTimes = [];

        //Counts up milliseconds
        for (let i = 0; i <= measurement.measureTimeMs; i += measurement.sampleIntervalMs) {
            let currentValue = this.getValueAtTime(i);

            retValues.push(currentValue);
            retTimes.push(i);
        }

        this.values = retValues;

        return [retValues, retTimes];*/
    }

    getValueAtTime(timeMs, refObject) {
        let currentPeriodCounter = timeMs % refObject.periodMS;

        let changeTime = refObject.periodMS * refObject.dutyCycle;
        let flag = currentPeriodCounter >= changeTime;

        if (refObject.initialValue) {
            flag = currentPeriodCounter < changeTime;
        }

        return flag ? refObject.high : refObject.low;
    }

    static generateFromStudent3(student) {
        let amplitudeHigh = parseInt(student.katNr);
        let amplitudeLow = 0;

        let onTimeMs = 100 + 2 * student.katNr;
        let offTimeMs = 2 * onTimeMs;

        let onTimePercent = (onTimeMs / (onTimeMs + offTimeMs)) * 100;

        return new RectangleSignal(
            onTimeMs + offTimeMs,  //ms
            amplitudeLow,   //V
            amplitudeHigh,  //V
            onTimePercent);
    }

    static generateFromStudent(student, symmetric, onTimePercent) {
        let amplitudeHigh = parseInt(student.katNr) + 5;  //V
        let amplitudeLow = 0;       //V

        if (symmetric) {
            amplitudeHigh *= 1/2;
            amplitudeLow = -amplitudeHigh;
        }

        return new RectangleSignal(
            2* student.katNr + 20,  //ms
            amplitudeLow,   //V
            amplitudeHigh,  //V
            onTimePercent);//%
    }
}