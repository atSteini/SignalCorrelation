Chart.register(ChartDataLabels);

let enableLog = true;
let logDefaults = false;

let projectTitle = "Signal Correlation";
let student = new Student(
    "Florian Steinkellner",
    19
);

let measurement;

// Settings
let enableLiveReload = false;
let loading = false;
let sampleTimeMs = 1;

let colorLineGraph = 'rgb(255, 99, 132)';
let colorRandom = 'rgb(100, 113, 255)';

let pulseSignalSender, pulseSignalReceiver, pulseSignalCorrelation;
let allGraphs = [];

let clickTimeThreshold = 1000; //ms
let lastClickTime = 0;

$('#logDefaults, #enableLog').click(function () {
    updateSettingsNoUpdate();
});

$('#symmetric, #name, #katNr, #sampleTimeMs').click(function () {
    updateSettings(true);
});

$('#btnUpdate').click(function () {
    update();
});

$(window).on('load', function () {
    update(true);
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

    measurement = new Measurement(sampleTimeMs, 15 * pulseSignalSender.pulseLengthMs);
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

function updateSettingsNoUpdate() {
    console.clear();

    enableLog = getChecked('enableLog');
    logDefaults = getChecked('logDefaults');
    enableLiveReload = getChecked('liveReload');

    $('#logDefaults').attr('disabled', !getChecked('enableLog'));

    for (let property in student) {
        student[property] = $('#' + property).val();
    }

    sampleTimeMs = parseInt($('#sampleTimeMs').val());

    $('#title').text(projectTitle);
    $('#subtitle').text(`${student.name} | ${student.katNr}`);

    checkAndPrintDefaults();
}

function update(isFirstLoad) {
    if (!isFirstLoad && !canClick()) {
        return;
    }

    updateLoading(true);

    updateSettingsNoUpdate();

    generateDefaults();

    checkAndPrintDefaults();

    initAllGraphs();
    renderAllGraphs();

    updateLoading(false);
}

function canClick() {
    let clickTime = Date.now();

    let canClick = clickTime - lastClickTime > clickTimeThreshold;

    lastClickTime = clickTime;

    return canClick;
}

function initAllGraphs() {
    allGraphs.push(initPulseSignal(pulseSignalSender, 'Pulssignal Sender', 'pulseSignalSender'));
    allGraphs.push(initPulseSignal(pulseSignalReceiver, 'Pulssignal Receiver', 'pulseSignalReceiver'));
}

function renderAllGraphs() {
    allGraphs.forEach(graph => {
        reloadCanvas(graph.divId);

        graph.render();
    });
}

function initPulseSignal(pulseSignal, name, divId) {
    let graphSignalSender = initLineGraphFor(
        pulseSignal, measurement,
        name, divId,
        false);

    let labels = ["Pulselänge:\n"];
    let numDropsReq = 1;
    [delayIndex, forceDelayIndex] = [0, 0];

    if (!pulseSignal.isSender) {
        numDropsReq = 2;

        labels.unshift("Verzögerung:\n");

        [delayIndex, forceDelayIndex] = SignalUtils.findIndexWhereNumDrops(graphSignalSender.dataValueArray, student.katNr / 4, 1, 1, true);
        graphSignalSender.showLabelByIndex(delayIndex);
    }

    [pulseLengthIndex, forcePulseLengthIndex] = SignalUtils.findIndexWhereNumDrops(graphSignalSender.dataValueArray, student.katNr / 4, 1, numDropsReq, true);
    graphSignalSender.showLabelByIndex(pulseLengthIndex);

    //Note to future self: Works because of the forcePulseLengthIndex being passed, this only sets the forced value when it is needed.
    graphSignalSender.formatShowIndexTime(labels, " ms", [pulseLengthIndex, pulseSignal.pulseLengthMs/*Sortof works: forcePulseLengthIndex - forceDelayIndex*/]);

    return graphSignalSender;
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

function checkAndPrintDefaults() {
    if (!enableLog || !logDefaults) {
        return;
    }

    console.clear();

    logTableWithName(student, "Student");

    logTableWithName(measurement, "Measurement");

    logTableWithName(pulseSignalSender, "PulseSignalSender");

    logTableWithName(pulseSignalReceiver, "PulseSignalReceiver");
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