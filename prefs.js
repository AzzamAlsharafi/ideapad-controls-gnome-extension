'use strict';

const { Adw, Gio, Gtk } = imports.gi;
const Gettext = imports.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Domain = Gettext.domain(Me.metadata.uuid);
const { gettext, ngettext } = Domain;
const _ = gettext;

const optionsUtils = Me.imports.optionsUtils;
const extensionSettings = ExtensionUtils.getSettings();

function init() {
    // Initialise gettext
    ExtensionUtils.initTranslations(Me.metadata.uuid);
}

function fillPreferencesWindow(window) {
    const builder = Gtk.Builder.new();
    builder.translation_domain = Me.metadata.uuid;
    builder.add_from_file(Me.dir.get_path() + "/template.ui");
    const page = builder.get_object("prefs_page");


    // Extension Menu - Extension menu location ComboBox
    const locationComboBox = builder.get_object("location_combo");

    locationComboBox.set_active_id(extensionSettings.get_boolean("tray-location") ? "tray" : "system_menu");

    locationComboBox.connect("changed", () => {
        extensionSettings.set_boolean("tray-location", locationComboBox.get_active_id() === "tray");
    });

    // Extension menu - Sysfs path
    const sysfsPathEntry = builder.get_object("sysfs_path_entry");

    extensionSettings.bind("sysfs-path",
      sysfsPathEntry,
      "text",
      Gio.SettingsBindFlags.DEFAULT
    );

    // Sysfs reset button
    const sysfsResetButton = builder.get_object("sysfs_reset_button");
    sysfsResetButton.connect("clicked", () => {
        extensionSettings.reset("sysfs-path");
    });

    // Extension Menu - Settings button Switch
    const settingsButtonSwitch = builder.get_object("settings_button_switch");

    builder.get_object("settings_button_row").activatable_widget = settingsButtonSwitch;

    extensionSettings.bind(
        "settings-button",
        settingsButtonSwitch,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );

    // Extension Menu - pkexec button switch
    const pkexecButtonSwitch = builder.get_object("pkexec_button_switch");

    builder.get_object("pkexec_button_row").activatable_widget = pkexecButtonSwitch;

    extensionSettings.bind(
        "use-pkexec",
        pkexecButtonSwitch,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );

    // Extension Menu - notifications button switch
    const notificationsButtonSwitch = builder.get_object("notifications_button_switch");

    builder.get_object("notifications_button_row").activatable_widget = notificationsButtonSwitch;

    extensionSettings.bind(
        "send-success-notifications",
        notificationsButtonSwitch,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );


    // Options - Options switches
    addOptionsSwitches(builder);
    
    window.add(page);
}

function addOptionsSwitches(builder){
    const optionsGroup = builder.get_object("options_group");
    const options = optionsUtils.getOptions();
    const translatedOptions = optionsUtils.getTranslatedOptions();

    // Create a Switch for each option
    for (let i = 0; i < options.length; i++) {
        // Convert option title to schema key, i.e. "Camera Lock" becomes "camera-lock-option"
        const optionKey = options[i].toLowerCase().replace(" ", "-") + "-option";

        const optionRow = new Adw.ActionRow({ title: _("%s Option").format(translatedOptions[i]) });
        optionsGroup.add(optionRow);

        const optionSwitch = new Gtk.Switch({
            active: extensionSettings.get_boolean(optionKey),
            valign: Gtk.Align.CENTER,
        });

        extensionSettings.bind(
            optionKey,
            optionSwitch,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        optionRow.add_suffix(optionSwitch);
        optionRow.activatable_widget = optionSwitch;
    }
}

