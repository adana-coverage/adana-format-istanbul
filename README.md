# adana-format-istanbul

Mimic the JSON result format of [istanbul].

For services or tools that need to use the [istanbul] JSON data, this formatter will happily convert the [adana]-based on over. This can be used, for example, to enable [partial line coverage] in [codecov].

[istanbul]: https://github.com/gotwarlost/istanbul
[codecov]: https://www.codecov.io/
[partial line coverage]: https://docs.codecov.io/docs/node