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

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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

// class DeviceCountSet() {

// }

interface Settings {
    logFile: string,
    removeFileCmd?: string,
    meltUsbKill?: boolean,
    foldersToRemove?: string[],
    killCommands?: string[],
    doSync?: boolean,
    doWipeRam?: boolean,
    doWipeSwap?: boolean,
    wipeRamCmd?: string,
    wipeSwapCmd?: string,
    shutDown?: boolean,
}

const log = (settings: Settings, msg: string) => {
    const logFile = settings.logFile;

    const contents = `\n${ new Date().toUTCString() } ${msg}\nCurrent state:\n`;
    let file = fs.openSync(logFile, 'a+');
    fs.writeFileSync(file, contents);

    /// Logs the current USB state.
    child_process.exec(`lsusb >> ${logFile}`);
}

const shred = (settings: Settings) => {
    const shredder = settings.removeFileCmd;

    /// List logs and settings to be removed.
    if (settings.meltUsbKill) {
        settings.foldersToRemove!.push(path.dirname(settings.logFile));
        settings.foldersToRemove!.push(path.dirname(SETTINGS_FILE));
        // TODO change this to the entire folder.
        const usbKillFile = path.dirname(process.mainModule!.filename);
        settings.foldersToRemove!.push(usbKillFile);
    }

    /// Remove files and folders.
    settings.foldersToRemove!.forEach((file) => {
        child_process.exec(`rm -r ${file}`);
    })
}

const killComputer = (settings: Settings) => {
    /// Log what is happening.
    if (!settings.meltUsbKill) {
        /// Don't waste time logging what will be destroyed.
        log(settings, 'Detected an USB change. Dumping list of connected devices and killing the computer...');
    }

    /// Shred as specified in settings.
    shred(settings);

    /// Execute the kill commands in order.
    settings.killCommands!.forEach((cmd) => child_process.exec(cmd));

    if (settings.doSync) {
        child_process.exec('sync');
    } else {
        /// If syncing is turned off because it might turn off then sleep for 5ms.
        /// This will still allow syncing in most cases.
        setTimeout(() => console.log(''), 5);
    }

    /// Wipe RAM and/or swap.
    if (settings.doWipeRam) {
        child_process.exec(settings.wipeRamCmd!);
    }
    if (settings.doWipeSwap) {
        child_process.exec(settings.wipeSwapCmd!);
    }

    /// Shut Down...
    if (settings.shutDown) {
        /// Power off the computer.
        child_process.exec('poweroff -f');
    }

    // TODO: sys.exit(0)
}

/// Loads a settings object from a json file.
const loadSettings = (filename: string): Settings => {
    const file = fs.readFileSync(filename);
    return JSON.parse(file.toString());
}

const lsusb = (): string => {
    return child_process.execSync('lsusb').toString();
}

interface Device {
    raw: string,
    id: string,
}

/// 
export class DeviceTracker {
    private settings: Settings;

    private startDevices: Device[] = [];
    private whitelist: Device[] = [];

    /**
     * Starts the main loop that checks usb devices every `sleepTime` seconds and kills
     * the computer. Allows only whitelisted usb devices to connect. Does not allow
     * any usb devices that were connected at the start to be removed.
     */
    start() {
        this.startDevices = this.lsusb();
        this.whitelist = this.startDevices + this.settings.whitelist;

        const msg = `[INFO] Started patrolling the USB ports every ${this.settings.sleepTime} seconds...`;
        log(this.settings, msg);
        console.log(msg);

        setInterval(() => this.loop(), this.settings.sleepTime);
    }

    private loop() {
        const currentDevices = this.lsusb();
        
        /// Checks that all devices are on the whitelist.
        currentDevices.forEach((device) => {
            if (!device as any in this.whitelist) {
                this.killComputer(this.settings);
            }
        });

        /// Checks that all start devices have not been removed.
        this.startDevices.forEach((device) => {
            if (!device as any in currentDevices) {
                // A device has disappeared.
                this.killComputer(this.settings);
            }
        });

        if (currentDevices.length > this.whitelist.length || currentDevices.length < this.startDevices.length) {
            /// Lengths should never exceed the number of allowed devices or fall below the number of start devices.
            this.killComputer(this.settings);
        }
    }


    lsusb(): Device[] {
        let rawDeviceList = child_process.execSync('lsusb').toString().split('\n');
        return this.processRawDevices(rawDeviceList);
    }

    private processRawDevices(rawDeviceList: string[]): Device[] {
        /// I'll implement this later
    }

    private log = (settings: Settings, msg: string) => {
        const logFile = settings.logFile;
    
        const contents = `\n${ new Date().toUTCString() } ${msg}\nCurrent state:\n`;
        let file = fs.openSync(logFile, 'a+');
        fs.writeFileSync(file, contents);
    
        /// Logs the current USB state.
        child_process.exec(`lsusb >> ${logFile}`);
    }
}


let s: string = 'Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub';
console.log(s.substr(s.indexOf(' ID ') + 4, 9))

/// TODO: Remove the postfix operators everywhere.
// let usbkill = new DeviceTracker();
// usbkill.start();