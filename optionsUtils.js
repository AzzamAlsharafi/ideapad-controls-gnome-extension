const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext;
const ExtensionUtils = imports.misc.extensionUtils;

const extensionSettings = ExtensionUtils.getSettings();
const Me = ExtensionUtils.getCurrentExtension();

const Domain = Gettext.domain(Me.metadata.uuid);
const { gettext, ngettext } = Domain;
const _ = gettext;

// Driver path
const filesSysfsDir = extensionSettings.get_string("sysfs-path")

// All options that the extension can support, regardless of the current device running the extension.
const allOptions = [_("Conservation Mode"), _("Camera"), _("Fn Lock"), _("Touchpad"), _("USB Charging")];
// Files names for each option in the driver files.
const allOptionsFiles = ["conservation_mode", "camera_power", "fn_lock", "touchpad", "usb_charging"];

// Lists to store options supported by this device.
let options = null;
let translatedOptions = null;
let optionsFiles = null;

async function writeStringToFile(string, filePath) {
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
  } catch(e) {
    imports.ui.main.notify(_("Ideapad Controls"),
      _(`Can't write %s to %s. See journalctl logs for more details`).format(string, filePath));
    console.log(`Something went wrong while writing ${string} to ${filePath}: ${e}`);
    console.log(`Look at the readme for permission errors fixes.`);
  }
}

// Check each option and determine if they are available in this device.
function prepareAvailableOptions() {
  options = [];
  translatedOptions = [];
  optionsFiles = [];
  
  for (let i = 0; i < allOptionsFiles.length; i++) {
    if(GLib.file_test(filesSysfsDir + allOptionsFiles[i], GLib.FileTest.EXISTS)){
      options.push(allOptions[i]);
      translatedOptions.push(gettext(allOptions[i]));
      optionsFiles.push(allOptionsFiles[i]);
    }
  }
}

// Returns available options in this device.
function getOptions() {
  if (options == null) {
    prepareAvailableOptions();
  }
  return options;
}

// Returns available options in this devices (translated)
function getTranslatedOptions() {
  if (translatedOptions == null) {
    prepareAvailableOptions();
  }
  return translatedOptions;
}

// Returns available options files in this device.
function getOptionsFiles() {
  if (optionsFiles == null) {
    prepareAvailableOptions();
  }
  return optionsFiles;
}

// Read option value from driver file.
function getOptionValue(optionIndex) {
  const file = Gio.File.new_for_path(filesSysfsDir + getOptionsFiles()[optionIndex]);
  const [, contents, etag] = file.load_contents(null);

  const decoder = new TextDecoder("utf-8");
  const contentsString = decoder.decode(contents);

  return contentsString.trim();
}

// Write option value to driver file.
function setOptionValue(optionIndex, value) {
  const optionFile = getOptionsFiles()[optionIndex];
  const destinationFile = filesSysfsDir + optionFile;
  if (extensionSettings.get_boolean("use-pkexec")) {
    GLib.spawn_command_line_async("pkexec bash -c 'echo " + value + " > " + destinationFile + "'");
  } else {
    console.log("Writing string to file " + value + " " + destinationFile);
    writeStringToFile(value.toString(), destinationFile);
    if (extensionSettings.get_boolean("send-success-notifications")) {
      imports.ui.main.notify(_("Ideapad Controls"), `${value == true ? _("Enabled") : _("Disabled")} ${getTranslatedOptions()[optionIndex]}`);
    }
  }
}

function destroy() {
  if(options != null) {
    options = null;
  }
  
  if(optionsFiles != null) {
    optionsFiles = null;
  }
}

