const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const extensionSettings = ExtensionUtils.getSettings();

// Driver path
const filesSysfsDir = extensionSettings.get_string("sysfs-path")

// All options that the extension can support, regardless of the current device running the extension.
const allOptions = ["Conservation Mode", "Camera", "Fn Lock", "Touchpad", "USB Charging"];
// Files names for each option in the driver files.
const allOptionsFiles = ["conservation_mode", "camera_power", "fn_lock", "touchpad", "usb_charging"];

// Lists to store options supported by this device.
let options = null;
let optionsFiles = null;

// Check each option and determine if they are available in this device.
function prepareAvailableOptions() {
  options = [];
  optionsFiles = [];
  
  for (let i = 0; i < allOptionsFiles.length; i++) {
    if(GLib.file_test(filesSysfsDir + allOptionsFiles[i], GLib.FileTest.EXISTS)){
      options.push(allOptions[i]);
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
  if (extensionSettings.get_boolean("use-pkexec")) {
    GLib.spawn_command_line_async("pkexec bash -c 'echo " + value + " > " + filesSysfsDir + optionFile + "'");
  } else {
    GLib.spawn_command_line_async("bash -c 'echo " + value + " > " + filesSysfsDir + optionFile + "'");
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
