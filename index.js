/* === IMPORTS ====================================================================================================== */

// Import some assets from Vortex that we'll need.
const path = require('path');
const { log, util } = require('vortex-api');

/* === CONSTANTS ==================================================================================================== */

// Nexus Mods domain for the game. e.g. nexusmods.com/morrowind
const GAME_ID = 'morrowind';

// BAIN folder pattern for filtering, which is a two-digit number followed by a space
const BAIN_FOLDER_PATTERN = /^\d{2}\s/;

/* === HELPER FUNCTIONS ============================================================================================= */

// Function to check if a path is a directory
// This function checks if the given file path ends with the system's path separator
function isDirectory(file) {
    return file.endsWith(path.sep);
}

// Function to check if a path is a file
// This function checks if the given file path does not end with the system's path separator
function isFile(file) {
    return !file.endsWith(path.sep);
}

// Function to check if a path is a top-level file
// This function checks if the first separator in the file path is also the last one
// For non-directories, each index is -1
function isTopLevel(file) {
    return file.indexOf(path.sep) === file.lastIndexOf(path.sep);
}

// Function to check if a path is a top-level directory
// This function checks if the file is a directory and if it is a top-level file
function isTopLevelDirectory(file) {
    return isDirectory(file) && isTopLevel(file);
}

// Function to check if a file is in the selected BAIN folders
// This function checks if the path starts with any of the selected folders
function isFileInSelectedFolder(file, selectedFolders) {
    return selectedFolders.some(folder => file.startsWith(folder));
}

// Function to get the part of the path relative to the selected BAIN folder
// This function uses path.relative to remove the BAIN folder from the file path
function getRelativePath(file, selectedFolders) {
    const bainFolder = selectedFolders.find(folder => file.startsWith(folder));
    return path.relative(bainFolder, file); // Use path.relative to remove the BAIN folder
}

/* === CORE FUNCTIONS =============================================================================================== */

// Function to filter BAIN folders
// This function returns any top-level folder with a name that starts with a two-digit number followed by a space
function getBainFolders(files) {
    return files.filter(file =>
        isTopLevelDirectory(file) && BAIN_FOLDER_PATTERN.test(file)
    );
}

// Function to test if the content is supported
// This function checks if the game ID matches and if there are any BAIN folders in the mod archive
function testSupportedContent(files, gameId) {
    let supported = ((gameId === GAME_ID) && (getBainFolders(files).length > 0));
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}

/* === MAIN INSTALLER LOGIC ========================================================================================= */

// Function to show a dialog for folder selection
// This function presents a dialog to the user with checkboxes for each BAIN folder
async function showFolderSelectionDialog(bainFolders, context) {
    const result = await context.api.showDialog('question', 'Choose BAIN Options', {
        text: 'Choose the folders you want to install:',
        checkboxes: bainFolders.map((folder, index) => ({
            id: folder,                  // Unique identifier for the checkbox
            text: path.basename(folder), // Label for the checkbox
            value: index === 0           // Tick the first folder by default
        })),
    }, [
        { label: 'Cancel' },
        { label: 'Continue', default: true },
    ]);

    // Check if the user canceled the dialog or if no folders were selected
    if (result.action === 'Cancel' || !Object.values(result.input).some(value => value)) {
        throw new util.UserCanceled('No folders selected or action canceled.');
    }

    // Return the selected folders
    return Object.entries(result.input)
        .filter(([, value]) => value)   // Keep entries where the value is true
        .map(([key]) => key);           // Extract only the keys
}

// Function to install content
// This function processes the files in the mod archive and generates instructions for Vortex
async function installContent(files, context) {
    // First we need the list of BAIN folders in the mod archive.
    const bainFolders = getBainFolders(files);
    log('debug', `BAIN folders: ${bainFolders.join(', ')}`);

    // Present the user with a list of folders to choose from.
    let selectedFolders = [];
    try {
        selectedFolders = await showFolderSelectionDialog(bainFolders, context);
    } catch (error) {
        log('error', `Dialog error: ${error.message}`);
        return []; // Exit early if an error occurs
    }
    log('debug', `Selected folders: ${selectedFolders.join(', ')}`);

    // Remove directories and anything that isn't under one of the selected folders.
    const filtered = files.filter(file => {
        return (isFile(file) && isFileInSelectedFolder(file, selectedFolders));
    });
    log('debug', `Filtered files: ${filtered.join(', ')}`);

    // Generate instructions for each file
    // Copy the file to the staging folder, preserving the directory structure, except for the BAIN folder itself.
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: getRelativePath(file, selectedFolders), // Get the relative path to the selected BAIN folder
        };
    });
    log('debug', `Generated instructions: ${JSON.stringify(instructions, null, 2)}`);

    // Return the instructions to Vortex
    return Promise.resolve({ instructions });
}

/* === MAIN ENTRY POINT ============================================================================================= */

function main(context) {
    // Register a new installer for the BAIN format
    context.registerInstaller(
        'morrowind-bain-support',                 // Unique identifier for the installer  
        25,                                       // Priority for the installer
        testSupportedContent,                     // Function to test if the content is supported
        (files) => installContent(files, context) // Function to install the content, passing the context
    );

    return true;
}

/* === EXPORTS ====================================================================================================== */

module.exports = {
    default: main,
};