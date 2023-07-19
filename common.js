const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const optionsUtils = Me.imports.optionsUtils;

function getIcon() {
  return Gio.icon_new_for_string(Me.dir.get_path() + "/icons/controls-big-symbolic.svg");
}

function addOptionsToMenu(menu) {
  const settings = ExtensionUtils.getSettings();

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
