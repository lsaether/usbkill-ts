#!/usr/bin/env ts-node

///             _     _     _ _ _ 
///            | |   | |   (_) | |
///  _   _  ___| |__ | |  _ _| | |
/// | | | |/___)  _ \| |_/ ) | | |
/// | |_| |___ | |_) )  _ (| | | |
/// |____/(___/|____/|_| \_)_|\_)_)
///
/// 
/// Ported to Typescript by Airwavves <Lsaether@protonmail.com>
/// 
/// Original Python code by:
/// Hephaestos <hephaestos@riseup.net> - 8764 EF6F D5C1 7838 8D10 E061 CF84 9CE5 42D0 B12B
/// <https://github.com/hephaest0s/usbkill>
///

import { DeviceTracker } from './src/DeviceTracker';
import * as process from 'process';

const CURRENT_PLATFORM = process.platform.toUpperCase();

if (CURRENT_PLATFORM !== 'LINUX') {
    throw new Error('Only supports linux!!!');
}

const SETTINGS_FILE = '/etc/usbkill.ini';

const helpMessage = `
usbkill is a simple program with one goal: quickly shutdown the computer when a USB is inserted or removed
Events are logged in /var/log/usbkill/kills.log
The USB id can be found by running the command 'lsusb'
Settings can be changed in /etc/usbkill.ini
In order to be able to shutdown the computer the program needs to be run as root

Options:
  -h --help:         Show this help
     --version:      Print usbkill version and exit
     --noTest:       Turns off testing. WILL TURN YOUR COMPUTER OFF AND MELT THIS FILE.
`
const splash = () => {
    console.log(`
                _     _     _ _ _  \n
               | |   | |   (_) | | \n
     _   _  ___| |__ | |  _ _| | | \n
    | | | |/___)  _ \| |_/ ) | | | \n
    | |_| |___ | |_) )  _ (| | | | \n
    |____/(___/|____/|_| \_)_|\_)_)\n
    `);
}

/// Runs
if (process.argv[2] == '--help') {
    console.log(helpMessage);
}
if (process.argv[2] == '--version') {
    console.log('usbkill-ts v0.1.0');
}
if (process.argv[2] == '--noTest') {
    splash();
    let usbkill = new DeviceTracker('settings.json', false);
    usbkill.start();
} else {
    splash();
    console.log('[TESTING]\n')
    let testUsbkill = new DeviceTracker('settings.json', true);
    testUsbkill.start();
}
