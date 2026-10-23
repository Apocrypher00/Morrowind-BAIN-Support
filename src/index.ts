/* === IMPORTS ====================================================================================================== */

// Import some assets from Vortex that we'll need.
import * as path from 'path';
import { log, types, util } from '@nexusmods/vortex-api';

/* === CONSTANTS ==================================================================================================== */

// Nexus Mods domain for the game. e.g. nexusmods.com/morrowind
const GAME_ID: string = 'morrowind';

// BAIN folder pattern for filtering, which is a two-digit number followed by a space
const BAIN_FOLDER_PATTERN: RegExp = /^\d{2}\s/;

/* === HELPER FUNCTIONS ============================================================================================= */

// Function to check if a path is a directory
function isDirectory(file: string): boolean {
    return file.endsWith(path.sep);
}

// Function to check if a path is a file
function isFile(file: string): boolean {
    return !file.endsWith(path.sep);
}

// Function to check if a path is top-level
function isTopLevel(file: string): boolean {
    return file.indexOf(path.sep) === file.lastIndexOf(path.sep);
}

// Function to check if a path is a top-level directory
function isTopLevelDirectory(file: string): boolean {
    return isDirectory(file) && isTopLevel(file);
}

// Function to check if a file is in the selected BAIN folders
function isFileInSelectedFolder(file: string, selectedFolders: string[]): boolean {
    return selectedFolders.some(folder => file.startsWith(folder));
}

// Function to get the part of the path relative to the selected BAIN folder
function getRelativePath(file: string, selectedFolders: string[]): string {
    const bainFolder: string = selectedFolders.find(folder => file.startsWith(folder));
    return bainFolder ? path.relative(bainFolder, file) : file;
}

/* === CORE FUNCTIONS =============================================================================================== */

// Function to filter BAIN folders
function getBainFolders(files: string[]): string[] {
    return files.filter(file =>
        isTopLevelDirectory(file) && BAIN_FOLDER_PATTERN.test(file)
    );
}

// Function to test if the content is supported
async function testSupportedContent(files: string[], gameId: string): Promise<types.ISupportedResult> {
    const supported: boolean = (gameId === GAME_ID) && (getBainFolders(files).length > 0);
    return { supported: supported, requiredFiles: [] };
}

/* === MAIN INSTALLER LOGIC ========================================================================================= */

// Function to show a dialog for folder selection
async function showFolderSelectionDialog(
    bainFolders: string[],
    archivePath: string,
    context: types.IExtensionContext
): Promise<string[]> {
    // Retrieve the array of downloaded archives
    const downloads: types.IDownload[] = Object.values(context.api.getState().persistent.downloads.files);

    // Get the archive file name from the path
    const archiveFileName: string = archivePath ? path.basename(archivePath) : 'Unknown Mod';

    // Find the mod download that matches the archive file name
    const modDownload: types.IDownload = downloads.find((ar: types.IDownload) => ar.localPath === archiveFileName);

    // Set the mod name to the archive file name or the mod download name
    const modName: string = modDownload?.modInfo?.name || archiveFileName;

    // Present a dialog to the user with checkboxes for each BAIN folder
    const result: types.IDialogResult = await context.api.showDialog('question', modName, {
        text: 'Choose the folders you want to install:',
        checkboxes: bainFolders.map((folder, index) => ({
            id: folder,
            text: path.basename(folder),
            value: index === 0
        })),
    }, [
        { label: 'Cancel' },
        { label: 'Continue', default: true },
    ]);

    // Check if the user canceled the dialog or if no folders were selected
    if (result.action === 'Cancel' || !Object.values(result.input).some((value: boolean) => value)) {
        // throw new util.UserCanceled('No folders selected or action canceled.');
        throw new util.UserCanceled(true);
    }

    // Return the selected folders
    return Object.entries(result.input)
        .filter(([, value]) => value)
        .map(([key]) => key);
}

// Function to install content
async function installContent(
    files: string[],
    archivePath: string,
    context: types.IExtensionContext
): Promise<{ instructions: types.IInstruction[] }> {
    // First we need the list of BAIN folders in the mod archive.
    const bainFolders: string[] = getBainFolders(files);
    log('debug', `BAIN folders: ${bainFolders.join(', ')}`);

    // Present the user with a list of folders to choose from.
    let selectedFolders: string[];
    try {
        selectedFolders = await showFolderSelectionDialog(bainFolders, archivePath, context);
    } catch (error) {
        log('error', `Dialog error: ${error.message}`);
        throw error;
    }
    log('debug', `Selected folders: ${selectedFolders.join(', ')}`);

    // Remove directories and anything that isn't under one of the selected folders.
    const filtered: string[] = files.filter(file => {
        return (isFile(file) && isFileInSelectedFolder(file, selectedFolders));
    });
    log('debug', `Filtered files: ${filtered.join(', ')}`);

    // Generate instructions for each file
    const instructions: types.IInstruction[] = filtered.map(file => ({
        type: 'copy',
        source: file,
        destination: getRelativePath(file, selectedFolders),
    }));
    log('debug', `Generated instructions: ${JSON.stringify(instructions, null, 2)}`);

    // Return the instructions to Vortex
    return { instructions };
}

/* === MAIN ENTRY POINT ============================================================================================= */

function main(context: types.IExtensionContext): boolean {
    // Register a new installer for the BAIN format
    context.registerInstaller(
        'morrowind-bain-support',
        25,
        testSupportedContent,
        (
            files: string[],
            _destinationPath: string,
            _gameId: string,
            _progressDelegate: types.ProgressDelegate,
            _choices?: any,
            _unattended?: boolean,
            archivePath?: string
        ) => installContent(files, archivePath, context)
    );

    return true;
}

/* === EXPORTS ====================================================================================================== */

export default main;
//module.exports = main;
