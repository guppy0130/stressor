# Stressor

## makes a lot of requests very quickly

### Usage

```sh
$ node index.js

Usage: index.js -u <url> [options]

Options:
  --url, -u         absolute url to connect to                        [required]
  --method, -m      type of HTTP request to make
                                       [choices: "GET", "POST"] [default: "GET"]
  --count, -c       how many times to make the request              [default: 1]
  --sequential, -s  make requests one after another instead of all at once
                                                                       [boolean]
  --timeout, -t     abort requests that take longer than this in ms
                                                        [number] [default: 5000]
  --verbose, -v     increase verbosity level                             [count]
  --help, -h        Show help                                          [boolean]
  --version         Show version number                                [boolean]

Examples:
  node index.js -u http://google.com  Make 1 GET request to http://google.com
```

* 4 (0-3) verbosity levels
* Prints out counts of returned status codes and timings at the minimum
