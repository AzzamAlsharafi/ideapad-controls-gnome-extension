const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const AggregateMenu = Main.panel.statusArea.aggregateMenu;

const options = ["Conservation Mode", "Camera", "Fn Lock", "Touchpad", "USB Charging"];

// List for files names of each options value,
// these files can be found in /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/
const optionsFile = ["conservation_mode", "camera_power", "fn_lock", "touchpad", "usb_charging"];

function getOptionValue(optionIndex) {
  const file = Gio.File.new_for_path("/sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/" + optionsFile[optionIndex]);
  const [, contents, etag] = file.load_contents(null);

  const decoder = new TextDecoder('utf-8');
  const contentsString = decoder.decode(contents);

  return contentsString.trim();
}

function setOptionValue(optionIndex, value) {
  GLib.spawn_command_line_async('pkexec bash -c "echo ' + value + ' > /sys/bus/platform/drivers/ideapad_acpi/VPC2004:00/' + optionsFile[optionIndex] + '"');
}

const TrayMenu = GObject.registerClass(
  class TrayMenu extends PanelMenu.Button {
    _init() {
      super._init(0);

      // Tray icon
      let icon = new St.Icon({
        gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icons/controls-big-symbolic.svg'),
        style_class: 'system-status-icon',
      });

      this.add_child(icon);

      addOptionsToMenu(this.menu);
    }
  }
);

const SystemMenu = GObject.registerClass(
  class SystemMenu extends PanelMenu.SystemIndicator {

    _init() {
      super._init();

      // Create extension's sub menu
      this.subMenu = new PopupMenu.PopupSubMenuMenuItem(Me.metadata.name, true);
      this.subMenu.icon.gicon = Gio.icon_new_for_string(Me.dir.get_path() + '/icons/controls-big-symbolic.svg');

      // Places the extension's sub menu after the battery sub menu if it exists,
      // otherwise places the extension's sub menu at the first spot. (Change later? First spot might be bad idea)
      const menuItems = AggregateMenu.menu._getMenuItems();
      const subMenuIndex = AggregateMenu._power ? (menuItems.indexOf(AggregateMenu._power.menu) + 1) : 0
      AggregateMenu.menu.addMenuItem(this.subMenu, subMenuIndex);

      addOptionsToMenu(this.subMenu.menu);
    }

    destroy(){
      this.subMenu.destroy();
      super.destroy();
    }
  }
);

function addOptionsToMenu(menu) {
  let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.ideapad-controls');

  // Create a switch item for each option
  for (let i = 0; i < options.length; i++) {
    // Convert option title to schema key, i.e. "Camera Lock" becomes "camera-lock-option"
    const optionKey = options[i].toLowerCase().replace(" ", "-") + "-option";

    let optionSwitch = new PopupMenu.PopupSwitchMenuItem(options[i], getOptionValue(i) === "1");
    menu.addMenuItem(optionSwitch);

    settings.bind(
      optionKey,
      optionSwitch,
      'visible',
      Gio.SettingsBindFlags.DEFAULT
    );

    optionSwitch.connect('toggled', () => {
      getOptionValue(i);
      setOptionValue(i, optionSwitch.state ? 1 : 0)
    });
  }
}

function updateLocation(trayLocation){
  if (trayLocation) {
    if (systemMenu != null) {
      systemMenu.destroy();
      systemMenu = null;
    }

    trayMenu = new TrayMenu();
    Main.panel.addToStatusArea('ideapad-controlMenu', trayMenu, 1);
  } else {
    if (trayMenu != null) {
      trayMenu.destroy();
      trayMenu = null;
    }

    systemMenu = new SystemMenu();
  }
}

function init() { }

let trayMenu = null;
let systemMenu = null;

let settings = null;
let trayListener = null;

function enable() {
  settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.ideapad-controls');

  updateLocation(settings.get_boolean("tray-location"));

  settings.connect("changed::tray-location", () => {
    updateLocation(settings.get_boolean("tray-location"));
  })
}

function disable() {
  settings.disconnect(trayListener);

  if (trayMenu != null) {
    trayMenu.destroy();
    trayMenu = null;
  }

  if (systemMenu != null) {
    systemMenu.destroy();
    systemMenu = null;
  }
}