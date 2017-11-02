let s: string = 'Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub';
console.log(s.substr(s.indexOf(' ID ') + 4, 9))