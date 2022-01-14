class SignalUtils {
    constructor() {
    }

    static measure(measurement, getValueFunction, refObject) {
        let retValues = [];
        let retTimes = [];

        //Counts up milliseconds
        for (let i = 0; i <= measurement.measureTimeMs; i += measurement.sampleIntervalMs) {
            let currentValue = getValueFunction(i, refObject);

            retValues.push(currentValue);
            retTimes.push(i);
        }

        refObject.values = retValues;

        return [retValues, retTimes];
    }

    static findPeriod(data, toleranceSpan, everyNthCheck) {
        return SignalUtils.findIndexWhereNumDrops(data, toleranceSpan, everyNthCheck, 3, true);
    }

    static findIndexWhereNumDrops(data, toleranceSpan, everyNthCheck, numDrops, showValueWhenHigh) {
        let changeCount = 0, previousValue = data[0];
        let retIndex = null;

        data.every(function (element, index) {
            if (index % everyNthCheck !== 0) {
                return true;
            }

            let distance = element === previousValue ? 0 : Math.abs(element - previousValue);

            if (distance > toleranceSpan) {
                changeCount++;
            }

            previousValue = element;

            if (changeCount === numDrops) {
                retIndex = index;

                return false;   // =break;
            }

            return true;        // =continue;
        });

        let retForcedIndex = retIndex;

        if (showValueWhenHigh) {
            if (data[retIndex] < toleranceSpan) {
                retIndex -= 1;
            }
        } else {
            if (data[retIndex] > toleranceSpan) {
                retIndex += 1;
            }
        }

        return [retIndex, retForcedIndex];
    }

    static getFourierPoints(measurement, signal) {
        let retTimes = [];

        let c = new Array(measurement.highestHarmonic);
        let phi = new Array(measurement.highestHarmonic);

        for (let k = 0; k < measurement.highestHarmonic; k++) {
            let a = 0, b = 0;

            for (let t = 0; t < measurement.measureTimeMs; t += measurement.sampleIntervalMs) {
                a +=
                    (2 / measurement.measureTimeMs)
                    * signal[t]
                    * Math.cos(2 * Math.PI * k * t * measurement.frequencyResolutionKHz);

                b +=
                    (2 / measurement.measureTimeMs)
                    * signal[t]
                    * Math.sin(2 * Math.PI * k * t * measurement.frequencyResolutionKHz);
            }

            c[k] = Math.sqrt(a * a + b * b);
            phi[k] = Math.atan(a / b);

            retTimes.push(k);
        }

        //Gleichanteil halbieren
        c[0] /= 2;

        return [c, phi, retTimes];
    }
}