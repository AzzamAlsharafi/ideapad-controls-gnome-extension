const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const options = ["Conservation Mode", "Camera", "Fn Lock", "Touchpad", "USB Charging"];

// List for files names of each options value,
// these files can be found in /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/
const optionsFile = ["conservation_mode", "camera_power", "fn_lock", "touchpad", "usb_charging"];

function getOptionValue(optionIndex) {
  const file = Gio.File.new_for_path("/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/" + optionsFile[optionIndex]);
  const [, contents, etag] = file.load_contents(null);
  
  const decoder = new TextDecoder('utf-8');
  const contentsString = decoder.decode(contents);
  log(contentsString.trim());

  return contentsString.trim();
}

function setOptionValue(optionIndex, value){
  GLib.spawn_command_line_async('pkexec bash -c "echo ' + value + ' > /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/' + optionsFile[optionIndex] + '"');
}

const ControlMenu = GObject.registerClass(
  class ControlMenu extends PanelMenu.Button {
    _init() {
      super._init(0);

      let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.ideapad-controls');

      // Tray icon
      let icon = new St.Icon({
        gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/controls-big-symbolic.svg'),
        style_class: 'system-status-icon',
      });

      this.add_child(icon);

      // Create a switch item for each option
      for (let i = 0; i < options.length; i++) {
        // Convert option title to schema key, i.e. "Camera Lock" becomes "camera-lock-option"
        const optionKey = options[i].toLowerCase().replace(" ", "-") + "-option";

        let optionSwitch = new PopupMenu.PopupSwitchMenuItem(options[i], getOptionValue(i) === "1");
        this.menu.addMenuItem(optionSwitch);

        settings.bind(
          optionKey,
          optionSwitch,
          'visible',
          Gio.SettingsBindFlags.DEFAULT
        );

        optionSwitch.connect('toggled', () => {
          log(options[i] + ' toggled ' + optionSwitch.state);
          getOptionValue(i);
          setOptionValue(i, optionSwitch.state ? 1 : 0)
        });
      }
    }
  }
);

function init() { }

let controlMenu;

function enable() {
  log('ENABLE: ideapad-control')

  controlMenu = new ControlMenu();
  Main.panel.addToStatusArea('ideapad-controlMenu', controlMenu, 1);
}

function disable() {
  log('DISABLE: ideapad-control')

  controlMenu.destroy();
}