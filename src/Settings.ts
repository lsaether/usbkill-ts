/// The interface of the Settings file.

export interface Settings {
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
    whitelist?: string[],
    sleepTime?: number,
}
