const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const UIQuickSettings = imports.ui.quickSettings;
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

const optionsUtils = Me.imports.optionsUtils;

// AggregateMenu for GNOME 42, QuickSettings for GNOME 43.
const AggregateMenu = Main.panel.statusArea.aggregateMenu;
const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

const extensionIcon = Gio.icon_new_for_string(Me.dir.get_path() + '/icons/controls-big-symbolic.svg');

const TrayMenu = GObject.registerClass(
  class TrayMenu extends PanelMenu.Button {
    _init() {
      super._init(0);

      // Tray icon
      let icon = new St.Icon({
        gicon: extensionIcon,
        style_class: 'system-status-icon',
      });

      this.add_child(icon);

      addOptionsToMenu(this.menu);
    }
  }
);

// There are two classes for system menu because GNOME 42 and 43 
// use different ways to interact with the system menu.
// GNOME 42 uses AggregateMenu (SystemMenu),
// and GNOME 43 uses QuickSettings (QSystemMenu).
const SystemMenu = GObject.registerClass(
  class SystemMenu extends PanelMenu.SystemIndicator {

    _init() {
      super._init();

      // Create extension's sub menu
      this.subMenu = new PopupMenu.PopupSubMenuMenuItem(Me.metadata.name, true);
      this.subMenu.icon.gicon = extensionIcon;

      // Places the extension's sub menu after the battery sub menu if it exists,
      // otherwise places the extension's sub menu at the first spot. (Change later? First spot might be bad idea)
      const menuItems = AggregateMenu.menu._getMenuItems();
      const subMenuIndex = AggregateMenu._power ? (menuItems.indexOf(AggregateMenu._power.menu) + 1) : 0
      AggregateMenu.menu.addMenuItem(this.subMenu, subMenuIndex);

      addOptionsToMenu(this.subMenu.menu);
    }

    destroy() {
      this.subMenu.destroy();
      super.destroy();
    }
  }
);

const QSystemMenu = GObject.registerClass(
  class QSystemMenu extends UIQuickSettings.SystemIndicator {

    _init() {
      super._init();

      // Create extension's sub menu
      this.toggleMenu = new UIQuickSettings.QuickMenuToggle({label: "IdeaPad", 
        gicon: extensionIcon});

      this.toggleMenu.menu.setHeader(extensionIcon, Me.metadata.name);
      
      QuickSettingsMenu.menu.addItem(this.toggleMenu);

      addOptionsToMenu(this.toggleMenu.menu);
    }

    destroy() {
      this.toggleMenu.destroy();
      super.destroy();
    }
  }
);

function addOptionsToMenu(menu) {
  let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.ideapad-controls');

  let options = optionsUtils.getOptions();

  // Create a switch item for each option
  for (let i = 0; i < options.length; i++) {
    // Convert option title to schema key, i.e. "Camera Lock" becomes "camera-lock-option"
    const optionKey = options[i].toLowerCase().replace(" ", "-") + "-option";

    let optionSwitch = new PopupMenu.PopupSwitchMenuItem(options[i], optionsUtils.getOptionValue(i) === "1");
    menu.addMenuItem(optionSwitch);

    settings.bind(
      optionKey,
      optionSwitch,
      'visible',
      Gio.SettingsBindFlags.DEFAULT
    );

    optionSwitch.connect('toggled', () => {
      optionsUtils.getOptionValue(i);
      optionsUtils.setOptionValue(i, optionSwitch.state ? 1 : 0)
    });
  }

  // Setting button
  menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

  let settingsButton = new PopupMenu.PopupMenuItem("Extension Settings");
  
  settingsButton.connect("activate", () => ExtensionUtils.openPrefs());

  menu.addMenuItem(settingsButton);

  settings.bind(
    "settings-button",
    settingsButton,
    "visible",
    Gio.SettingsBindFlags.DEFAULT);
}

function updateLocation(trayLocation) {
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

    systemMenu = getSystemMenu();
  }
}

// Return appropriate system menu based on shell version.
function getSystemMenu() {
  if (shellVersion < 43) {
    return new SystemMenu();
  } else {
    return new QSystemMenu();
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

  trayListener = settings.connect("changed::tray-location", () => {
    updateLocation(settings.get_boolean("tray-location"));
  })
}

function disable() {
  if (trayListener != null) {
    settings.disconnect(trayListener);
    trayListener = null;
  }

  if (trayMenu != null) {
    trayMenu.destroy();
    trayMenu = null;
  }

  if (systemMenu != null) {
    systemMenu.destroy();
    systemMenu = null;
  }

  optionsUtils.destroy();
}