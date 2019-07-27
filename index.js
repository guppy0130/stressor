const axios = require('axios');
const yargs = require('yargs')
                .usage('Usage: $0 -m <method> -u <url> -c <count> [options]')
                .options({
                    'method': {
                        alias: 'm',
                        describe: 'type of HTTP request to make',
                        demandOption: true,
                        choices: ['GET', 'POST']
                    },
                    'url': {
                        alias: 'u',
                        describe: 'absolute url to connect to',
                        demandOption: true
                    },
                    'count': {
                        alias: 'c',
                        describe: 'how many times to make the request',
                        demandOption: true
                    },
                    'sequential': {
                        alias: 's',
                        describe: 'make requests one after another instead of all at once',
                        boolean: true
                    },
                    'timeout': {
                        alias: 't',
                        describe: 'abort requests that take longer than this in ms',
                        number: true
                    },
                    'verbose': {
                        alias: 'v',
                        describe: 'increase verbosity level',
                        count: true
                    }
                })
                .help('h')
                .alias('h', 'help')
                .argv;

let {method, url, count, sequential, verbose} = yargs;
let statusCounter = {};

function warn()  { verbose >= 0 && console.log.apply(console, arguments); }
function info()  { verbose >= 1 && console.log.apply(console, arguments); }
function debug() { verbose >= 2 && console.log.apply(console, arguments); }

const wrapper = async () => {
    const hrstart = process.hrtime();
    if (sequential) {
        info('Running in sequential mode');
        for (let i = 0; i < count; i++) {
            debug(`processing request ${i}`);
            await axios({method, url, validateStatus: () => {return true;} }).then(resp => {
                code = resp.status.toString();
                debug(`request ${i}: response status code: ${code}`);
                statusCounter[code] = (statusCounter[code] || 0) + 1;
            });
        }
    } else {
        info('Running in parallel mode');
        let requests = [];

        const generator = () => {
            return axios({method, url, validateStatus: () => {return true;}});
        }

        for (let i = 0; i < count; i++) {
            debug(`generated promise ${i}`);
            requests.push(generator());
        }

        await axios.all(requests).then(response => {
            response.reduce((obj, resp, i) => {
                code = resp.status.toString();
                debug(`request ${i}: response status code: ${code}`);
                obj[code] = (obj[code] || 0) + 1;
                return obj;
            }, statusCounter);
        });
    }

    debug(statusCounter);
    for (let statusCode in statusCounter) {
        console.log(`${statusCounter[statusCode]} requests had a status code of ${statusCode}`);
    }

    const hrend = process.hrtime(hrstart);
    info(`${count} queries performed in ${hrend.join('.')}s`);
}

wrapper();
