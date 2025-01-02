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

const startTime = Date.now();

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

let lastCpuTimes = null;
let lastIdleTime = null;

function benchmarkMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    console.log('Memory Usage:');
    console.log(`rss: ${memoryUsage.rss / 1024 / 1024} MB`); // Resident Set Size (physical memory used)
    console.log(`heapTotal: ${memoryUsage.heapTotal / 1024 / 1024} MB`);
    console.log(`heapUsed: ${memoryUsage.heapUsed / 1024 / 1024} MB`);

    // Calculate CPU usage
    const cpuUsage = calculateCpuUsage();
    console.log(`CPU Usage: ${cpuUsage}%`);

    // I/O performance (hypothetical)
    logFileIoPerformance();
}

function calculateCpuUsage() {
    const cpus = os.cpus();
    if (!lastCpuTimes) {
        lastCpuTimes = cpus.map(cpu => cpu.times);
        return 0;
    }

    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu, index) => {
        const lastTimes = lastCpuTimes[index];

        const idle = cpu.times.idle - lastTimes.idle;
        const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0) -
            Object.values(lastTimes).reduce((sum, time) => sum + time, 0);

        totalIdle += idle;
        totalTick += total;
    });

    lastCpuTimes = cpus.map(cpu => cpu.times);
    return ((1 - totalIdle / totalTick) * 100).toFixed(2);
}

let totalReadBytes = 0;
let totalWriteBytes = 0;

function logFileIoPerformance() {
    const stats = fs.statSync('athlete_data.csv'); // Replace with actual file being monitored
    const readBytes = stats.size; // Example: read sizes from file stats
    totalReadBytes += readBytes;

    // Log dummy write operation size example here, you can track actual writes
    // Replace the following with actual I/O operations if running multiple reads/writes.
    const writeBytes = Math.random() * 1000; // Random size for demonstration
    totalWriteBytes += writeBytes;

    console.log(`Total Read Bytes: ${totalReadBytes}`);
    console.log(`Total Write Bytes: ${totalWriteBytes}`);
}

// Call benchmarkMemoryUsage periodically to monitor system metrics
setInterval(benchmarkMemoryUsage, 10 * 1000); // Every 10 seconds
