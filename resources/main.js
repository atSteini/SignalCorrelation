Chart.register(ChartDataLabels);

let enableLog = true;
let logDefaults = false;

let projectTitle = "Signal Correlation";
let student = new Student(
    "Florian Steinkellner",
    19
);

let measurement, measurement3;

// Settings
let enableLiveReload = false;
let loading = false;
let sampleTimeMs = 1;
let forceInlineLabels = false;

let colorLineGraph = 'rgb(255, 99, 132)';

let pulseSignalSender, pulseSignalReceiver, pulseSignalReceiver2, rectangleSignal3;
let allGraphs = [];

let clickTimeThreshold = 1000; //ms
let lastClickTime = 0;

let addLengthMs2 = 50;

$('#logDefaults, #enableLog').click(function () {
    updateSettingsNoUpdate();
});

$('#symmetric, #name, #katNr, #sampleTimeMs').click(function () {
    updateSettings(true);
});

$('#btnUpdate').click(function () {
    update();
});

$('#settingsCollapse').on("click", function () {
    this.classList.toggle("active");
    let content = this.nextElementSibling;

    if (content.style.display !== "none") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
});

$('#saveAllCanvases').on("click", function () {
    saveAllCanvases();
});

let $loading = $('#loadingDiv').hide();
$(document)
    .ajaxStart(function () {
        $loading.show();
    })
    .ajaxStop(function () {
        $loading.hide();
    });

function generateDefaults() {
    pulseSignalSender = SinglePulseSignal.generateFromStudent(
        student,
        true
    );

    pulseSignalReceiver = SinglePulseSignal.generateFromStudent(
        student,
        false
    );

    rectangleSignal3 = RectangleSignal.generateFromStudent3(student);

    measurement = new Measurement(sampleTimeMs, 15 * pulseSignalSender.pulseLengthMs);

    measurement3 = clone(measurement);
    measurement3.measureTimeMs = 15 * rectangleSignal3.onTimeMs;

}

function updateLoading(load) {
    loading = load;

    if (loading) {
        $loading.ajaxStart();
        return;
    }

    $loading.ajaxStop();
}

function updateSettings(isCalledFromDom) {
    if (isCalledFromDom && !enableLiveReload) {
        return;
    }

    updateSettingsNoUpdate();

    update();
}

function updateSettingsNoUpdate(assignment) {
    console.clear();

    enableLog = getChecked('enableLog');
    logDefaults = getChecked('logDefaults');
    enableLiveReload = getChecked('liveReload');
    forceInlineLabels = getChecked('inLineLabels');

    $('#logDefaults').attr('disabled', !getChecked('enableLog'));

    for (let property in student) {
        student[property] = $('#' + property).val();
    }

    sampleTimeMs = parseInt($('#sampleTimeMs').val());

    $('#title').text(projectTitle);
    $('#subtitle').text(`${student.name} | ${student.katNr}`);

    checkAndPrintDefaults(assignment);
}

function update(isFirstLoad, assignment) {
    if (!isFirstLoad && !canClick()) {
        return;
    }

    updateLoading(true);

    updateSettingsNoUpdate(assignment);

    generateDefaults();

    checkAndPrintDefaults(assignment);

    switch (assignment) {
        case 1:
            initGraphs1();
            break;
        case 2:
            initGraphs2();
            break;
        case 3:
            initGraphs3();
            break;
        default:
            break;
    }

    renderAllGraphs();

    updateLoading(false);
}

function canClick() {
    let clickTime = Date.now();

    let canClick = clickTime - lastClickTime > clickTimeThreshold;

    lastClickTime = clickTime;

    return canClick;
}

function initGraphs1() {
    log("initializing graphs 1...");

    allGraphs.push(initPulseSignal(pulseSignalSender, measurement, 'Pulssignal Sender', 'pulseSignalSender'));
    allGraphs.push(initPulseSignal(pulseSignalReceiver, measurement, 'Pulssignal Receiver', 'pulseSignalReceiver'));
    allGraphs.push(initAKFStandard('Autokorrelationsfunktion', 'akfCanvas', pulseSignalSender, pulseSignalReceiver, measurement));
    allGraphs.push(initAKFNormed('Normierte Autokorrelationsfunktion', 'akfNormedCanvas', pulseSignalSender, pulseSignalReceiver, measurement));
}

function initGraphs2() {
    log("initializing graphs 2...");

    pulseSignalReceiver2 = clone(pulseSignalReceiver);
    pulseSignalReceiver2.pulseLengthMs += addLengthMs2;

    allGraphs.push(initPulseSignal(pulseSignalSender, measurement, 'Pulssignal Sender 2', 'pulseSignalSender2'));
    allGraphs.push(initPulseSignal(pulseSignalReceiver2, measurement, 'Pulssignal Receiver 2', 'pulseSignalReceiver2'));
    allGraphs.push(initAKFStandard('Autokorrelationsfunktion 2', 'akfCanvas2', pulseSignalSender, pulseSignalReceiver2, measurement));
    allGraphs.push(initAKFNormed('Normierte Autokorrelationsfunktion 2', 'akfNormedCanvas2', pulseSignalSender, pulseSignalReceiver2, measurement));
}

function initGraphs3() {
    log("initializing graphs 3...");

    allGraphs.push(initRectangleSignal(rectangleSignal3, measurement3, 'Rectangle Signal', 'rectangleSignal'));
    allGraphs.push(initAKFStandard('Autokorrelationsfunktion 3', 'akfCanvas3', rectangleSignal3, rectangleSignal3, measurement3));
    allGraphs.push(initAKFNormed('Normierte Autokorrelationsfunktion 3', 'akfNormedCanvas3', rectangleSignal3, rectangleSignal3, measurement3));
}

function initAllGraphs() {
    initGraphs1();
    initGraphs2();
    initGraphs3();
}

function renderAllGraphs() {
    allGraphs.forEach(graph => {
        reloadCanvas(graph.divId);

        graph.render();
    });
}

function initRectangleSignal(rectangleSignal, measurement, name, divId) {
    let graph = initLineGraphFor(
        rectangleSignal, measurement,
        name, divId,
        false);

    let [sampleValues, sampleTimes] = [[], []];
    [sampleValues, sampleTimes] = rectangleSignal.getSamplePoints(measurement);

    let periodIndexes = SignalUtils.findPeriod(sampleValues, 1, 1);

    graph.showLabelByIndex(periodIndexes[1]);
    graph.formatShowIndexTime("Periodendauer: ", " ms", [null, null]);

    return graph;
}

function initPulseSignal(pulseSignal, measurement, name, divId) {
    let graphSignalSender = initLineGraphFor(
        pulseSignal, measurement,
        name, divId,
        false);

    let labels = ["Pulselänge:\n"];
    let numDropsReq = 1;
    let [delayIndex, forceDelayIndex] = [0, 0];

    if (!pulseSignal.isSender) {
        numDropsReq = 2;

        labels.unshift("Verzögerung:\n");

        [delayIndex, forceDelayIndex] = SignalUtils.findIndexWhereSpike(graphSignalSender.dataValueArray, student.katNr / 4, 1, 1, true);
        graphSignalSender.showLabelByIndex(delayIndex);
    }

    let [pulseLengthIndex, forcePulseLengthIndex] = [0, 0];
    [pulseLengthIndex, forcePulseLengthIndex] = SignalUtils.findIndexWhereSpike(graphSignalSender.dataValueArray, student.katNr / 4, 1, numDropsReq, true);
    graphSignalSender.showLabelByIndex(pulseLengthIndex);

    let pulseLengthCalculated = (forcePulseLengthIndex - forceDelayIndex) * sampleTimeMs;

    //Note to future self: Works because of the forcePulseLengthIndex being passed, this only sets the forced value when it is needed.
    graphSignalSender.formatShowIndexTime(labels, " ms", [pulseLengthIndex, pulseLengthCalculated]);

    return graphSignalSender;
}

function initAKFNormed(name, divId, sender, receiver, measurement) {
    return initAKF(name, divId, SignalUtils.calculateAutoCorrelationNormed(sender, receiver, measurement));
}

function initAKFStandard(name, divId, sender, receiver, measurement) {
    return initAKF(name, divId, SignalUtils.calculateAutoCorrelation(sender, receiver, measurement));
}

function initAKF(name, divId, [sampledValues, sampledTimes]) {
    let graphAKF = new Graph(
        sampledValues,
        Graph.getLabelsFromDataValues(sampledTimes, '', ' ms'),
        {
            responsiveAnimationDuration: 2000
        },
        name,
        divId
    );

    let peaks = SignalUtils.findAllPeakIndexes(sampledValues);

    for (let index of peaks) {
        graphAKF.showLabelByIndex(index);
    }

    let valueSuffix = " | ";

    if (!forceInlineLabels && peaks.length > 1) {
        valueSuffix = "\n";
    }

    graphAKF.formatShowIndexTimeValue("Zeit: ", " ms", "Wert: ", valueSuffix)

    graphAKF.interpolate(true);

    return graphAKF;
}

function initLineGraphFor(signal, measurement, name, divId, interpolate) {
    let [sampledData, sampledTimes] = signal.getSamplePoints(measurement);

    let graph = new Graph(
        sampledData,
        Graph.getLabelsFromDataValues(sampledTimes, '', ' ms'),
        {
            responsiveAnimationDuration: 2000
        },
        name,
        divId
    );

    graph.setAllColors(colorLineGraph);
    //graph.showLabelByIndex(findPeriod(sampledData, 1, 1));

    graph.showTitle(`${student.name} | ${student.katNr}`);

    //graph.formatShowIndexTime("Period:", "ms")
    graph.interpolate(interpolate);

    return graph;
}

function checkAndPrintDefaults(assignment) {
    if (!enableLog || !logDefaults) {
        return;
    }

    console.clear();

    logTableWithName(student, "Student");

    logTableWithName(measurement, "Measurement");

    switch (assignment) {
        case 1:
            logTableWithName(pulseSignalSender, "PulseSignalSender");
            logTableWithName(pulseSignalReceiver, "PulseSignalReceiver");
            break
        case 2:
            logTableWithName(pulseSignalSender, "PulseSignalSender");
            logTableWithName(pulseSignalReceiver2, "PulseSignalReceiver 2");
            break;
        case 3:
            logTableWithName(rectangleSignal3, "RectangleSignal (3)");
            break;
    }
}

function saveAllCanvases() {
    let currentFileName = document.location.pathname.match(/[^\/]+$/)[0].slice(0, -5);

    for (let canvas of $("canvas")) {
        exportCanvas(canvas, `${currentFileName}_${canvas.id}`);
    }
}

function exportCanvas(canvasObj, name) {
    canvasObj.toBlob(function (blob) {
        saveAs(blob, name);
    });
}

function reloadCanvas(divId) {
    let oldCanvas = $('#' + divId);
    let parentElement = oldCanvas.parent();

    oldCanvas.remove();

    let canvas = document.createElement('canvas');
    canvas.id = divId;

    parentElement.append(canvas);
}

function log(object) {
    if (!enableLog) {
        return;
    }

    console.log(object);
}

function logTableWithName(object, name) {
    if (!enableLog) {
        return;
    }

    let modObj = {"Object": name, ...object};

    delete modObj.values;

    console.table(modObj)
}

function getChecked(chkbxId) {
    return $("#" + chkbxId).is(':checked')
}

function clone(obj) {
    // https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
    if (null == obj || "object" != typeof obj) {
        return obj;
    }

    let copy = new obj.constructor();

    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }

    return copy;
}