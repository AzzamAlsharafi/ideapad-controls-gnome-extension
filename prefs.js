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
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Create a Switch for each option
    for (let i = 0; i < options.length; i++) {
        // Convert option title to schema key, i.e. "Camera Lock" becomes "camera-lock-option"
        const optionKey = options[i].toLowerCase().replace(" ", "-") + "-option";

        const optionRow = new Adw.ActionRow({ title: options[i] + " Option" });
        group.add(optionRow);

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