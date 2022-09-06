'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const optionsUtils = Me.imports.optionsUtils;

function init() { }

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings(
                "org.gnome.shell.extensions.ideapad-controls");

    const builder = Gtk.Builder.new();
    builder.add_from_file(Me.dir.get_path() + "/template.ui");
    const page = builder.get_object("prefs_page");


    // Extension Menu - Extension menu location ComboBox
    const locationComboBox = builder.get_object("location_combo");

    locationComboBox.set_active_id(settings.get_boolean("tray-location") ? "tray" : "system_menu");

    locationComboBox.connect("changed", () => {
        settings.set_boolean("tray-location", locationComboBox.get_active_id() === "tray");
    });

    // Extension Menu - Settings button Switch
    const settingsButtonSwitch = builder.get_object("settings_button_switch");

    builder.get_object("settings_button_row").activatable_widget = settingsButtonSwitch;

    settings.bind(
        "settings-button",
        settingsButtonSwitch,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );


    // Options - Options switches
    addOptionsSwitches(builder, settings);
    
    window.add(page);
}

function addOptionsSwitches(builder, settings){
    const optionsGroup = builder.get_object("options_group");

    const options = optionsUtils.getOptions();

    // Create a Switch for each option
    for (let i = 0; i < options.length; i++) {
        // Convert option title to schema key, i.e. "Camera Lock" becomes "camera-lock-option"
        const optionKey = options[i].toLowerCase().replace(" ", "-") + "-option";

        const optionRow = new Adw.ActionRow({ title: options[i] + " Option" });
        optionsGroup.add(optionRow);

        const optionSwitch = new Gtk.Switch({
            active: settings.get_boolean(optionKey),
            valign: Gtk.Align.CENTER,
        });

        settings.bind(
            optionKey,
            optionSwitch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        optionRow.add_suffix(optionSwitch);
        optionRow.activatable_widget = optionSwitch;
    }
}