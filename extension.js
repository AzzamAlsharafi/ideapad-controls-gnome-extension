const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const St = imports.gi.St;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const optionsUtils = Me.imports.optionsUtils;

const AggregateMenu = Main.panel.statusArea.aggregateMenu;

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

    destroy() {
      this.subMenu.destroy();
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