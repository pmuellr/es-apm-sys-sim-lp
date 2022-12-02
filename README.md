es-apm-sys-sim - elasticsearch apm system metrics simulator for launchpad
================================================================================

Writes apm system metrics documents containing cpu usage and free memory
metrics, for 3 hosts, on the specified interval, to
the specified index at the specified elasticsearch cluster.

The cpu usage metrics are controlled via button presses on
a Novation Launchpad, with the history of the last 8 documents written displayed
on the Launchpad.

Here are the relevant buttons on the launchpad:

|  . |  1 |  2 |  3 |  4 |  5 |  6 |  7 |  8 |
|  - |  - |  - |  - |  - |  - |  - |  - |  - |
|  1 | h8 | h7 | h6 | h5 | h4 | h3 | h2 | h1 |
|  2 | i8 | i7 | i6 | i5 | i4 | i3 | i2 | i1 |
|  3 | j8 | j7 | j6 | j5 | j4 | j3 | j2 | j1 |
|  4 |  . |  . |  . |  . |  . |  . |  . |  . |
|  5 | a4 | b4 | c4 |  . |  . |  . |  . |  . |
|  6 | a3 | b3 | c3 |  . |  . |  . |  . |  . |
|  7 | a2 | b2 | c2 |  . |  . |  . |  . |  . |
|  8 | a1 | b1 | c1 |  . |  . |  . |  . |  . |

input:

a1, b1, c1: metric is   0% for host 1, 2, 3 respectively
a2, b2, c2: metric is  33% "
a3, b3, c3: metric is  67% "
a3, b3, c3: metric is 100% "

output:

h8 ... h1: the values for the last 8 documents, oldest to newest for host 1
i8 ... i1: " for host 2
j8 ... j1: " for host 3

The following fields are written to the elasticsearch index by this utility:

    @timestamp                - current time
    host.name                 - from parameter
    host.name.keyword         - keyword version of host.name
    system.cpu.total.norm.pct - changes over time


example
================================================================================

```console
$ es-apm-sys-sim.js 10
running with interval: 10 sec; hosts: 3; indexName: es-apm-sys-sim; clusterURL: https://elastic:changeme@localhost:9200
sample doc: {
  @timestamp: 2020-03-15T14:57:22.110Z
  host: {name: "host-1"}
  system: {
    cpu: {
      total: {
        norm: {pct: 0.5}
      }
    }
  }
}

host-1: c:0.69 m:277K   host-2: c:0.60 m:239K   host-3: c:0.50 m:239K      docs: 2
```


usage
================================================================================

```
es-apm-sys-sim [options] <intervalSeconds> [<indexName> [<clusterURL>]]
```

Every `<intervalSeconds>` seconds, documents will be written to `<indexName>` at
the elasticsearch cluster `<clusterURL>` for 3 hosts.  The cpu
and free memory values will change over time.

You can quit the program by pressing `ctrl-c`.  

The documents written are pretty minimal - open an issue or PR if you want
more fields.


install
================================================================================

    npm install -g pmuellr/es-apm-sys-sim-lp


license
================================================================================

This package is licensed under the MIT license.  See the [LICENSE.md][] file
for more information.


contributing
================================================================================

Awesome!  We're happy that you want to contribute.

Please read the [CONTRIBUTING.md][] file for more information.


[LICENSE.md]: LICENSE.md
[CONTRIBUTING.md]: CONTRIBUTING.md
[CHANGELOG.md]: CHANGELOG.md