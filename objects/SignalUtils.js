class SignalUtils {
    constructor() {
    }

    static calculateAutoCorrelation(sentSignal, receivedSignal, measurement) {
        let [senderValues, receiverValues] = [[], []];
        [senderValues, receiverValues] = SignalUtils.getSentAndReceivedData(sentSignal, receivedSignal, measurement);

        let akf = new Array(senderValues.length).fill(0);
        let times = new Array(akf.length);

        for (let i = 0; i < akf.length; i++) {
            for (let t = 0; t < akf.length; t++) {
                akf[i] += senderValues[t] * receiverValues[(t + i) % akf.length];
            }

            times[i] = i;
        }

        return [akf, times];
    }

    static calculateAutoCorrelationNormed(sentSignal, receivedSignal, measurement) {
        let [senderValues, receiverValues] = [[], []];
        [senderValues, receiverValues] = SignalUtils.getSentAndReceivedData(sentSignal, receivedSignal, measurement);

        let [akf, times] = [[], []];
        [akf, times] = SignalUtils.calculateAutoCorrelation(senderValues, receiverValues, measurement);

        let normedAkf = [];
        for (let akfVal of akf) {
            normedAkf.push(akfVal / Math.sqrt(
                SignalUtils.calculatePoweredSum(senderValues, 2)
                * SignalUtils.calculatePoweredSum(receiverValues, 2)
            ));
        }

        return [normedAkf, times];
    }

    static calculatePoweredSum(data, power) {
        let squaredSum = 0;

        for (let element of data) {
            squaredSum += Math.pow(element, power);
        }

        return squaredSum;
    }

    static getSentAndReceivedData(sentSignal, receivedSignal, measurement) {
        let senderValues = sentSignal;
        let receiverValues = receivedSignal;

        if (!Array.isArray(sentSignal)) {
            senderValues = sentSignal.getSamplePoints(measurement)[0];
        }

        if (!Array.isArray(receivedSignal)) {
            receiverValues = receivedSignal.getSamplePoints(measurement)[0];
        }

        return [senderValues, receiverValues];
    }

    static measure(measurement, getValueFunction, refObject) {
        let retValues = [];
        let retTimes = [];

        //Counts up milliseconds
        for (let i = 0; i <= measurement.measureTimeMs; i += measurement.sampleIntervalMs) {
            let currentValue = getValueFunction(i, refObject);

            if (!Number.isInteger(currentValue)) {
                currentValue = parseInt(currentValue)
            }

            retValues.push(currentValue);
            retTimes.push(i);
        }

        refObject.values = retValues;

        return [retValues, retTimes];
    }

    static findPeriod(data, toleranceSpan, everyNthCheck) {
        let numSpikes = 3;
        if (data[0] > toleranceSpan) {
            numSpikes = 2;
        }

        return SignalUtils.findIndexWhereSpike(data, toleranceSpan, everyNthCheck, numSpikes, true);
    }

    static findAllPeakIndexes(data) {
        let peakIndexes = [];

        data.every(function (element, index) {
            if (index+1 > data.length) {
                if (element > data[index-1]) {
                    peakIndexes.push(index);
                }
                return true;
            }

            if (data[index - 1] < element && element >= data[index+1]) {
                peakIndexes.push(index);
            }

            return true;
        });

        return peakIndexes;
    }

    static findIndexWhereSpike(data, toleranceSpan, everyNthCheck, numSpikes, showValueWhenHigh) {
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

            if (changeCount === numSpikes) {
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