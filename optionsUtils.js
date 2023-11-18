import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

// All options that the extension can support, regardless of the current device running the extension.
const ALL_OPTIONS = ['Conservation Mode', 'Camera', 'Fn Lock', 'Touchpad', 'USB Charging'];
// Files names for each option in the driver files.
const ALL_OPTION_FILES = ['conservation_mode', 'camera_power', 'fn_lock', 'touchpad', 'usb_charging'];

/**
 * Writes a string to file
 *
 * @param {string} string The string to write
 * @param {string} filePath The destination file
 */
export async function writeStringToFile(string, filePath) {
    const fd = Gio.File.new_for_path(filePath);
    const contentBytes = new GLib.Bytes(string);

    try {
        await new Promise((resolve, reject) => {
            // Try to write the file and throw an error if it's not writable
            // We don't use the REPLACE_DESTINATION FileCreateFlag, as it would lead to permission errors.
            fd.replace_contents_bytes_async(contentBytes, null, false, Gio.FileCreateFlags.NONE, null, (_, res) => {
                try {
                    resolve(fd.replace_contents_finish(res));
                } catch (e) {
                    reject(e);
                }
            });
        });
    } catch (e) {
        console.log(`Something went wrong while writing ${string} to ${filePath}: ${e}`);
        console.log('Look at the readme for permission errors fixes.');
    }
}

// Check each option and determine if they are available in this device.
/**
 * Get the list of supported option files
 *
 * @param {string} sysfsPath ideapad_laptop sysfs path
 */
export function getSupportedOptions(sysfsPath) {
    const optionsFiles = [];

    for (let i = 0; i < ALL_OPTION_FILES.length; i++) {
        if (GLib.file_test(sysfsPath + ALL_OPTION_FILES[i], GLib.FileTest.EXISTS))
            optionsFiles.push(ALL_OPTION_FILES[i]);
    }

    return optionsFiles;
}

/**
 * Get the name of an option
 *
 * @param {string} optionFile The option file name
 */
export function getOptionName(optionFile) {
    return ALL_OPTIONS[ALL_OPTION_FILES.indexOf(optionFile)];
}

