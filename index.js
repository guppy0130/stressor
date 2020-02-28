const got = require('got');
const yargs = require('yargs')
                .usage('Usage: $0 -u <url> [options]')
                .options({
                    'url': {
                        alias: 'u',
                        describe: 'absolute url to connect to',
                        demandOption: true
                    },
                    'method': {
                        alias: 'm',
                        describe: 'type of HTTP request to make',
                        default: 'GET',
                        choices: ['GET', 'POST']
                    },
                    'count': {
                        alias: 'c',
                        describe: 'how many times to make the request',
                        default: 1
                    },
                    'sequential': {
                        alias: 's',
                        describe: 'make requests one after another instead of all at once',
                        boolean: true
                    },
                    'timeout': {
                        alias: 't',
                        describe: 'abort requests that take longer than this in ms',
                        number: true,
                        default: 5000
                    },
                    'verbose': {
                        alias: 'v',
                        describe: 'increase verbosity level',
                        count: true
                    }
                })
                .help('help')
                .alias('help', 'h')
                .version(require('./package.json').version)
                .example('node index.js -u http://google.com', 'Make 1 GET request to http://google.com')
                .argv;

let {method, url, count, sequential, verbose, timeout} = yargs;

const get = got.extend({
    timeout: timeout / 5,
    retry: {
        limit: 5,
        errorCodes: ['ETIMEDOUT'],
        statusCodes: []
    },
    throwHttpErrors: false,
    prefixUrl: url,
    method: method
});

let statusCounter = {};
let timings = {};

function warn()  { verbose >= 0 && console.log.apply(console, arguments); }
function info()  { verbose >= 1 && console.log.apply(console, arguments); }
function debug() { verbose >= 2 && console.log.apply(console, arguments); }
function superDebug() { verbose >= 3 && console.log.apply(console, arguments); }

const average = (arr) => {
    return sum(arr) / arr.length;
};

const stdDev = (arr) => {
    let avg = average(arr);
    let squareDiffs = arr.map((value) => {
        return (value - avg) * (value - avg);
    });
    let avgSquareDiff = average(squareDiffs);
    let stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
};

const sum = (arr) => {
    return arr.reduce((a, b) => a + b, 0);
};

const wrapper = async () => {
    const hrstart = process.hrtime();
    if (sequential) {
        debug('Running in sequential mode');
        for (let i = 0; i < count; i++) {
            superDebug(`Processing request ${i}`);
            const resp = await get('/');
            for (const timingType in resp.timings.phases) {
                if (!timings[timingType]) {
                    timings[timingType] = [];
                }
                timings[timingType].push(resp.timings.phases[timingType]);
            }
            let code = resp.statusCode;
            superDebug(`Request ${i}: response status code: ${code}`);
            statusCounter[code] = (statusCounter[code] || 0) + 1;
        }
    } else {
        debug('Running in parallel mode');
        let requests = [];

        const generator = () => {
            return get('/');
        }

        for (let i = 0; i < count; i++) {
            superDebug(`Generated promise ${i}`);
            requests.push(generator());
        }
        debug(`Generated ${count} promises`);

        await Promise.allSettled(requests).then(response => {
            response.reduce((obj, resp, i) => {
                const { value } = resp;
                if (value && value.timings) {
                    for (const timingType in value.timings.phases) {
                        if (!timings[timingType]) {
                            timings[timingType] = [];
                        }
                        timings[timingType].push(value.timings.phases[timingType]);
                    }
                    code = value.statusCode;
                    superDebug(`Request ${i}: response status code: ${code}`);
                    obj[code] = (obj[code] || 0) + 1;
                } else {
                    console.log(resp);
                }
                return obj;
            }, statusCounter);
        });
    }

    const realCount = sum(Object.values(statusCounter));
    const hrend = process.hrtime(hrstart);
    info(`${realCount} ${realCount === 1 ? 'query' : 'queries'} performed in ${(hrend[0]*1e9 + hrend[1])/(1e9)}s.`);

    for (let [statusType, count] of Object.entries(statusCounter)) {
        statusCounter[statusType] = {count};
    }
    console.table(statusCounter);
    let averages = {};
    for (let [timingType, arr] of Object.entries(timings)) {
        averages[timingType] = {
            'min (ms)': Math.min(...arr),
            'max (ms)': Math.max(...arr),
            'avg (ms)': average(arr),
            'stdDev (ms)': stdDev(arr)
        }
    }
    console.table(averages);
}

wrapper();
