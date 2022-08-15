'use strict';

const { Adw, Gio, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const options = ["Conservation Mode", "Camera", "Fn Lock", "Touchpad", "USB Charging"]

function init() { }

function fillPreferencesWindow(window) {
    const settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.ideapad-controls');

    const page = new Adw.PreferencesPage();

    const extensionGroup = new Adw.PreferencesGroup({
        title: "Extension menu",
        description: "These settings require extension reload (disable then enable) to take effect."
    });
    page.add(extensionGroup);

    const locationRow = new Adw.ActionRow({ title: "Extension menu location", subtitle: "Choose where to place the extension menu." });
    extensionGroup.add(locationRow);

    const trayToggle = new Gtk.ToggleButton({ label: "Tray", valign: Gtk.Align.CENTER });
    const systemToggle = new Gtk.ToggleButton({ label: "System Menu", valign: Gtk.Align.CENTER });

    trayToggle.set_group(systemToggle);

    trayToggle.set_active(settings.get_boolean("tray-location"));
    systemToggle.set_active(!settings.get_boolean("tray-location"));

    settings.bind(
        "tray-location",
        trayToggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    )

    const locationBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 5 });
    locationBox.append(trayToggle);
    locationBox.append(systemToggle);

    locationRow.add_suffix(locationBox);



    const optionsGroup = new Adw.PreferencesGroup({
        title: "Options",
        description: "Choose which options to keep in the extension menu."
    });
    page.add(optionsGroup);

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
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        optionRow.add_suffix(optionSwitch);
        optionRow.activatable_widget = optionSwitch;
    }

    window.add(page);
}