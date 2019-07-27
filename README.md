# Stressor

## makes a lot of requests very quickly

### Usage

```sh
$ node index.js

Usage: index.js -m <method> -u <url> -c <count> [options]

Options:
  --version         Show version number                                [boolean]
  --method, -m      type of HTTP request to make
                                             [required] [choices: "GET", "POST"]
  --url, -u         absolute url to connect to                        [required]
  --count, -c       how many times to make the request                [required]
  --sequential, -s  make requests one after another instead of all at once
                                                                       [boolean]
  --timeout, -t     abort requests that take longer than this in ms     [number]
  --verbose, -v     increase verbosity level                             [count]
  -h, --help        Show help                                          [boolean]
```

* 3 verbosity levels (generally a good idea to run with just one, though, to view timings)
* prints out counts of returned status codes at the minimum
