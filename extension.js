const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const UIQuickSettings = imports.ui.quickSettings;
const Main = imports.ui.main;
const AggregateMenu = Main.panel.statusArea.aggregateMenu; // GNOME 42 System Menu
const QuickSettingsMenu = Main.panel.statusArea.quickSettings; // GNOME 43 System Menu

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split(".");
const shellVersion = Number.parseInt(major);

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const optionsUtils = Me.imports.optionsUtils;

const extensionIcon = Gio.icon_new_for_string(Me.dir.get_path() + "/icons/controls-big-symbolic.svg");

function init() {}

let extensionMenu = null;
let settings = null;
let trayListener = null;

function enable() {
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
    extensionMenu = getSystemMenu();
  }
}

// Each of GNOME 42 and GNOME 43 use a different system menu,
// that's why there are two classes for system menu.
// GNOME 42 uses AggregateMenu (SystemMenu),
// and GNOME 43 uses QuickSettings (QSystemMenu).
function getSystemMenu() {
  if (shellVersion < 43) {
    log("GNOME 42");
    return new SystemMenu();
  } else {
    log("GNOME 43");
    return new QSystemMenu();
  }
}

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
      const subMenuIndex = AggregateMenu._power ? (menuItems.indexOf(AggregateMenu._power.menu) + 1) : 0;
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
      this.toggleMenu = new UIQuickSettings.QuickMenuToggle({label: "IdeaPad", // Not enough space for full name :(
        gicon: extensionIcon});

      this.toggleMenu.menu.setHeader(extensionIcon, Me.metadata.name);
      
      // Since this "toggle" menu isn't being used as a toggle button
      // clicking should just open the menu.
      this.toggleMenu.connect("clicked", () => {
        this.toggleMenu.menu.open();
      })

      QuickSettingsMenu.menu.addItem(this.toggleMenu);

      addOptionsToMenu(this.toggleMenu.menu);
    }

    destroy() {
      this.toggleMenu.destroy();
      super.destroy();
    }
  }
);

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
