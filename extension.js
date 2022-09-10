const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split(".");
const shellVersion = Number.parseInt(major);

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const optionsUtils = Me.imports.optionsUtils;

// Each of GNOME 42 and GNOME 43 use a different system menu,
// that's why there are two classes for system menu.
// GNOME 42 uses AggregateMenu (SystemMenu),
// and GNOME 43 uses QuickSettings (QSystemMenu).
let SystemMenu = shellVersion < 43 ? Me.imports.aggregateMenu.SystemMenu : Me.imports.quickSettingsMenu.SystemMenu;

function init() {}

let extensionIcon = null;
let extensionMenu = null;
let settings = null;
let trayListener = null;

function enable() {
  log("<here");
  log(SystemMenu);
  log("here>");

  extensionIcon = Gio.icon_new_for_string(Me.dir.get_path() + "/icons/controls-big-symbolic.svg");

  settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.ideapad-controls");

  updateLocation(settings);

  trayListener = settings.connect("changed::tray-location", () => {
    updateLocation(settings);
  })
}

function disable() {
  if (trayListener != null) {
    settings.disconnect(trayListener);
    trayListener = null;
  }

  if (extensionMenu != null) {
    extensionMenu.destroy();
    extensionMenu = null;
  }

  extensionIcon = null;
  settings = null;

  optionsUtils.destroy();
}

function updateLocation(settings) {
  if(extensionMenu != null){
    extensionMenu.destroy();
    extensionMenu = null;
  }

  if (settings.get_boolean("tray-location")) { // Tray mode
    extensionMenu = new TrayMenu();
    Main.panel.addToStatusArea("ideapad-controls", extensionMenu, 1);
  } else { // System menu mode
    extensionMenu = new SystemMenu();
  }
}

const TrayMenu = GObject.registerClass(
  class TrayMenu extends PanelMenu.Button {
    _init() {
      super._init(0);

      // Tray icon
      const icon = new St.Icon({
        gicon: extensionIcon,
        style_class: "system-status-icon",
      });

      this.add_child(icon);

      addOptionsToMenu(this.menu);
    }
  }
);

function addOptionsToMenu(menu) {
  const options = optionsUtils.getOptions();

  // Create a switch item for each option
  for (let i = 0; i < options.length; i++) {
    // Convert option title to schema key, i.e. "Camera Lock" becomes "camera-lock-option"
    const optionKey = options[i].toLowerCase().replace(" ", "-") + "-option";

    const optionSwitch = new PopupMenu.PopupSwitchMenuItem(options[i], optionsUtils.getOptionValue(i) === "1");
    menu.addMenuItem(optionSwitch);

    settings.bind(
      optionKey,
      optionSwitch,
      "visible",
      Gio.SettingsBindFlags.DEFAULT
    );

    optionSwitch.connect("toggled", () => {
      optionsUtils.getOptionValue(i);
      optionsUtils.setOptionValue(i, optionSwitch.state ? 1 : 0);
    });
  }

  // Setting button
  menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

  const settingsButton = new PopupMenu.PopupMenuItem("Extension Settings");
  
  settingsButton.connect("activate", () => ExtensionUtils.openPrefs());

  menu.addMenuItem(settingsButton);

  settings.bind(
    "settings-button",
    settingsButton,
    "visible",
    Gio.SettingsBindFlags.DEFAULT);
}
