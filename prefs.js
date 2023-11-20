import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {getSupportedOptions, getOptionName} from './optionsUtils.js';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class IdeapadControlsPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
        this.initTranslations(this.metadata.uuid);
    }

    fillPreferencesWindow(window) {
        const builder = Gtk.Builder.new();
        builder.translation_domain = this.metadata.uuid;
        builder.add_from_file(`${this.path}/template.ui`);
        const page = builder.get_object('prefs_page');

        const extensionSettings = this.getSettings();
        // Extension Menu - Extension menu location ComboBox
        const locationComboBox = builder.get_object('location_combo');

        locationComboBox.set_active_id(extensionSettings.get_boolean('tray-location') ? 'tray' : 'system_menu');

        locationComboBox.connect('changed', () => {
            extensionSettings.set_boolean('tray-location', locationComboBox.get_active_id() === 'tray');
        });

        // Extension menu - Sysfs path
        const sysfsPathEntry = builder.get_object('sysfs_path_entry');

        extensionSettings.bind('sysfs-path',
            sysfsPathEntry,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Sysfs reset button
        const sysfsResetButton = builder.get_object('sysfs_reset_button');
        sysfsResetButton.connect('clicked', () => {
            extensionSettings.reset('sysfs-path');
        });

        // Extension Menu - Settings button Switch
        const settingsButtonSwitch = builder.get_object('settings_button_switch');

        builder.get_object('settings_button_row').activatable_widget = settingsButtonSwitch;

        extensionSettings.bind(
            'settings-button',
            settingsButtonSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Extension Menu - pkexec button switch
        const pkexecButtonSwitch = builder.get_object('pkexec_button_switch');

        builder.get_object('pkexec_button_row').activatable_widget = pkexecButtonSwitch;

        extensionSettings.bind(
            'use-pkexec',
            pkexecButtonSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // Extension Menu - notifications button switch
        const notificationsButtonSwitch = builder.get_object('notifications_button_switch');

        builder.get_object('notifications_button_row').activatable_widget = notificationsButtonSwitch;

        extensionSettings.bind(
            'send-success-notifications',
            notificationsButtonSwitch,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );


        // Options - Options switches
        this.addOptionsSwitches(builder, extensionSettings);

        window.add(page);
    }

    addOptionsSwitches(builder, extensionSettings) {
        const optionsGroup = builder.get_object('options_group');
        const options = getSupportedOptions(extensionSettings.get_string('sysfs-path'));
        const translatedOptions = [];

        for (const option of options) {
            const optionName = getOptionName(option);
            // Translate the name with gettext
            translatedOptions.push(_(optionName));
        }

        // Create a Switch for each option
        for (let i = 0; i < options.length; i++) {
            // Convert option title to schema key, i.e. "camera_power" becomes "camera-power-option"
            const optionKey = `${options[i].toLowerCase().replace('_', '-')}-option`;

            const optionRow = new Adw.ActionRow({title: _('%s switch').format(translatedOptions[i])});
            optionsGroup.add(optionRow);

            const optionSwitch = new Gtk.Switch({
                active: extensionSettings.get_boolean(optionKey),
                valign: Gtk.Align.CENTER,
            });

            extensionSettings.bind(
                optionKey,
                optionSwitch,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );

            optionRow.add_suffix(optionSwitch);
            optionRow.activatable_widget = optionSwitch;
        }
    }
}
