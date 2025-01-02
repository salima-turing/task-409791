const fs = require('fs');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({
    input: fs.createReadStream('athlete_data.csv'),
    output: process.stdout,
    terminal: false
});

const athleteData = [];
const maxDataPoints = 100000; // Adjust as needed based on memory constraints

// Create a buffer to store incoming data points
const dataBuffer = new Buffer(maxDataPoints * 32); // Assuming 32 bytes per data point (adjust based on actual size)
let bufferIndex = 0;

// const startTime = Date.now();

rl.on('line', (line) => {
    const [athleteId, metric1, metric2, metric3] = line.split(',');

    // Convert data to 32-bit float (adjust based on data type)
    const metric1Float = parseFloat(metric1);
    const metric2Float = parseFloat(metric2);
    const metric3Float = parseFloat(metric3);

    // Write the data to the buffer
    dataBuffer.writeFloatLE(metric1Float, bufferIndex);
    bufferIndex += 4;
    dataBuffer.writeFloatLE(metric2Float, bufferIndex);
    bufferIndex += 4;
    dataBuffer.writeFloatLE(metric3Float, bufferIndex);
    bufferIndex += 4;

    if (bufferIndex >= dataBuffer.length) {
        processData();
        bufferIndex = 0;
    }
});

rl.on('close', () => {
    processData();
    console.log(`Processed ${athleteData.length} data points in ${(Date.now() - startTime) / 1000} seconds`);
});

function processData() {
    if (athleteData.length === 0) return;

    // Perform analytics on athleteData
    // For demonstration purposes, we'll just calculate the average
    const totalMetric1 = athleteData.reduce((acc, data) => acc + data.metric1, 0);
    const totalMetric2 = athleteData.reduce((acc, data) => acc + data.metric2, 0);
    const totalMetric3 = athleteData.reduce((acc, data) => acc + data.metric3, 0);

    const avgMetric1 = totalMetric1 / athleteData.length;
    const avgMetric2 = totalMetric2 / athleteData.length;
    const avgMetric3 = totalMetric3 / athleteData.length;

    console.log('Average Metrics:', avgMetric1, avgMetric2, avgMetric3);

    athleteData.splice(0, athleteData.length);
}

function benchmarkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    console.log('Memory Usage:');
    console.log(`rss: ${memoryUsage.rss / 1024 / 1024} MB`); // Resident Set Size (physical memory used)
    console.log(`heapTotal: ${memoryUsage.heapTotal / 1024 / 1024} MB`);
    console.log(`heapUsed: ${memoryUsage.heapUsed / 1024 / 1024} MB`);
}

// Call benchmarkMemoryUsage periodically to monitor memory usage
setInterval(benchmarkMemoryUsage, 10000); // Every 10 seconds

const perf_hooks = require('perf_hooks');

const startTime = perf_hooks.performance.now();

rl.on('close', () => {
    const endTime = perf_hooks.performance.now();
    const executionTime = endTime - startTime;
    console.log(`Processed ${athleteData.length} data points in ${executionTime.toFixed(2)} ms`);
});

function benchmarkPerformance() {
    const memoryUsage = process.memoryUsage();
    const cpus = os.cpus();
    const totalCpus = cpus.length;
    let cpuUsage = 0;

    cpus.forEach((cpu) => {
        cpuUsage += cpu.times.user + cpu.times.sys;
    });

    const idleTime = cpus.reduce((idle, cpu) => idle + cpu.times.idle, 0);
    const cpuUsagePercent = (1 - (idleTime / (cpuUsage + idleTime))) * 100;

    // Measure I/O performance by reading a small file
    const ioStartTime = perf_hooks.performance.now();
    fs.readFile('small_file.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        const ioEndTime = perf_hooks.performance.now();
        const ioTime = ioEndTime - ioStartTime;

        console.log('Performance Metrics:');
        console.log(`Memory Usage:`);
        console.log(`rss: ${memoryUsage.rss / 1024 / 1024} MB`);
        console.log(`heapTotal: ${memoryUsage.heapTotal / 1024 / 1024} MB`);
        console.log(`heapUsed: ${memoryUsage.heapUsed / 1024 / 1024} MB`);
        console.log(`CPU Usage: ${cpuUsagePercent.toFixed(2)}%`);
        console.log(`I/O Time: ${ioTime.toFixed(2)} ms`);
    });
}

setInterval(benchmarkPerformance, 10000); // Every 10 seconds
