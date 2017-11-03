import { DeviceTracker } from './src/DeviceTracker';
import * as child_process from 'child_process';
// import * as sys from 'sys';

const deviceTracker = new DeviceTracker(undefined, true);
deviceTracker.loadSettings('./settings.json');
deviceTracker.start();

// child_process.exec('echo hello', (error, stdout, stderr) => { console.log(stdout) })