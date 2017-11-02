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

const help_message = `
usbkill is a simple program with one goal: quickly shutdown the computer when a USB is inserted or removed.
Events are logged in /var/log/usbkill/kills.log
You can configure a whitelist of USB ids that are acceptable to insert and the remove.
The USB id can be found by running the command 'lsusb'.
Settings can be changed in /etc/usbkill.ini
In order to be able to shutdown the computer, this program needs to run as root.

Options:
  -h --help:         Show this help
     --version:      Print usbkill version and exit
     --cs:           Copy program folder usbkill.ini to /etc/usbkill/usbkill.ini
     --no-shut-down: Execute all the (destructive) commands you defined in usbkill.ini,
                       but don't turn off the computer
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
