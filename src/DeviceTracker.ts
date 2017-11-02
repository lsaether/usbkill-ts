import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';

import { Settings } from './Settings';

interface Device {
    raw: string,
    id: string,
}

export class DeviceTracker {
    private settings: Settings;
    private settingsLoaded: boolean = false;

    private startDevices: Device[] = [];
    private whitelist: Device[] = [];

    constructor(settings?: string) {
        if (settings !== undefined) {
            this.loadSettings(settings);
        }
    }

    /// Loads a settings object from a json file.
    public loadSettings(filename: string): boolean {
        const file = fs.readFileSync(filename);
        this.settings = JSON.parse(file.toString());
        this.settingsLoaded = true;
        return true;
    }

    /**
     * Starts the main loop that checks usb devices every `sleepTime` seconds and kills
     * the computer if an unknown device is found. Allows only whitelisted usb devices to connect.
     * Does not allow any usb devices that were connected at the start to be removed.
     */
    public start() {
        if (!this.loadSettings) {
            throw new Error('You must have a settings file loaded first...')
        }

        this.startDevices = this.lsusb();
        this.startDevices.forEach((device) => this.whitelist.push(device));

        const msg = `[INFO] Started patrolling the USB ports every ${this.settings.sleepTime} seconds...`;
        this.log(msg);
        console.log(msg);

        setInterval(() => this.loop(), this.settings.sleepTime!);
    }

    private loop() {
        const currentDevices = this.lsusb();
        
        /// Checks that all devices are on the whitelist.
        currentDevices.forEach((device) => {
            if (this.whitelist.indexOf(device) === -1) {
                this.killComputer(this.settings);
            }
        });

        /// Checks that all start devices have not been removed.
        this.startDevices.forEach((device) => {
            if (currentDevices.indexOf(device) === -1) {
                // A device has disappeared.
                this.killComputer(this.settings);
            }
        });

        if (currentDevices.length > this.whitelist.length || currentDevices.length < this.startDevices.length) {
            /// Lengths should never exceed the number of allowed devices or fall below the number of start devices.
            this.killComputer(this.settings);
        }
    }

    private killComputer = () => {
        /// Log what is happening.
        if (!this.settings.meltUsbKill) {
            /// Don't waste time logging what will be destroyed.
            this.log('Detected an USB change. Dumping list of connected devices and killing the computer...');
        }
    
        /// Shred as specified in settings.
        this.shred();
    
        /// Execute the kill commands in order.
        this.settings.killCommands!.forEach((cmd) => child_process.exec(cmd));
    
        if (this.settings.doSync) {
            child_process.exec('sync');
        } else {
            /// If syncing is turned off because it might turn off then sleep for 5ms.
            /// This will still allow syncing in most cases.
            setTimeout(() => console.log(''), 5);
        }
    
        /// Wipe RAM and/or swap.
        if (this.settings.doWipeRam) {
            child_process.exec(this.settings.wipeRamCmd!);
        }
        if (this.settings.doWipeSwap) {
            child_process.exec(this.settings.wipeSwapCmd!);
        }
    
        /// Shut Down...
        if (this.settings.shutDown) {
            /// Power off the computer.
            child_process.exec('poweroff -f');
        }
    
        // TODO: sys.exit(0)
    }

    private shred = () => {
        const shredder = this.settings.removeFileCmd;
    
        /// List logs and settings to be removed.
        if (this.settings.meltUsbKill) {
            this.settings.foldersToRemove!.push(path.dirname(this.settings.logFile));
            this.settings.foldersToRemove!.push(path.dirname(SETTINGS_FILE));
            // TODO change this to the entire folder.
            const usbKillFile = path.dirname(process.mainModule!.filename);
            this.settings.foldersToRemove!.push(usbKillFile);
        }
    
        /// Remove files and folders.
        this.settings.foldersToRemove!.forEach((file) => {
            child_process.exec(`rm -r ${file}`);
        })
    }


    lsusb(): Device[] {
        let rawDeviceList = child_process.execSync('lsusb').toString().split('\n');
        return this.processRawDevices(rawDeviceList);
    }

    private processRawDevices(rawDeviceList: string[]): Device[] {
        /// I'll implement this later
    }

    private log = (msg: string) => {
        const logFile = this.settings.logFile;
    
        const contents = `\n${ new Date().toUTCString() } ${msg}\nCurrent state:\n`;
        let file = fs.openSync(logFile, 'a+');
        fs.writeFileSync(file, contents);
    
        /// Logs the current USB state.
        child_process.exec(`lsusb >> ${logFile}`);
    }
}
