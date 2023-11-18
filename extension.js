import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import {panel, notify} from 'resource:///org/gnome/shell/ui/main.js';
import {PopupSwitchMenuItem, PopupMenuItem, PopupSeparatorMenuItem} from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {SystemMenu, TrayMenu} from './menus.js';
import {getSupportedOptions, getOptionName, writeStringToFile} from './optionsUtils.js';

export default class IdeapadControlsExtension extends Extension {
    constructor(metadata) {
        super(metadata);

        console.info(`Initialising ${this.metadata.name}`);
        this.initTranslations(this.metadata.uuid);
    }

    enable() {
        this.settings = this.getSettings();

        this.supportedOptions = getSupportedOptions(this.settings.get_string('sysfs-path'));
        this.icon = Gio.icon_new_for_string(`${this.path}/icons/controls-big-symbolic.svg`);
        this.updateLocation();

        this.trayListener = this.settings.connect('changed::tray-location', () => {
            this.updateLocation();
        });
    }

    disable() {
        if (this.trayListener) {
            this.settings.disconnect(this.trayListener);
            this.trayListener = null;
        }

        if (this.extensionMenu) {
            this.extensionMenu.destroy();
            this.extensionMenu = null;
        }

        this.icon = null;
        this.settings = null;
        this.supportedOptions = null;
    }

    updateLocation() {
        if (this.extensionMenu) {
            this.extensionMenu.destroy();
            this.extensionMenu = null;
        }

        if (this.settings.get_boolean('tray-location')) {
            // Running in the system tray
            this.extensionMenu = new TrayMenu(this);
            panel.addToStatusArea('ideapad-controls', this.extensionMenu, 1);
        } else {
            // Running in the system menu
            this.extensionMenu = new SystemMenu(this);
        }
    }

    addOptionsToMenu(menu) {
        const translatedOptions = [];
        const sysfsPath = this.settings.get_string('sysfs-path');

        for (const option of this.supportedOptions) {
            const optionName = getOptionName(option);
            // Translate the name with gettext
            translatedOptions.push(_(optionName));
        }

        // Create a switch item for each option
        for (let i = 0; i < this.supportedOptions.length; i++) {
            // Convert option title to schema key, i.e. "camera_power" becomes "camera-power-option"
            const optionKey = `${this.supportedOptions[i].toLowerCase().replace('_', '-')}-option`;

            const optionSwitch = new PopupSwitchMenuItem(translatedOptions[i], this.getOptionValue(sysfsPath, this.supportedOptions[i]) === '1');
            menu.addMenuItem(optionSwitch);

            this.settings.bind(
                optionKey,
                optionSwitch,
                'visible',
                Gio.SettingsBindFlags.DEFAULT
            );

            optionSwitch.connect('toggled', () => {
                this.getOptionValue(sysfsPath, this.supportedOptions[i]);
                this.setOptionValue(sysfsPath, this.supportedOptions[i], optionSwitch.state);
            });
        }


        // Setting button
        menu.addMenuItem(new PopupSeparatorMenuItem());

        const settingsButton = new PopupMenuItem(_('Extension Settings'));

        settingsButton.connect('activate', () => this.openPreferences());

        menu.addMenuItem(settingsButton);

        this.settings.bind(
            'settings-button',
            settingsButton,
            'visible',
            Gio.SettingsBindFlags.DEFAULT);
    }

    // Read option value from driver file.
    getOptionValue(sysfsPath, optionFile) {
        const file = Gio.File.new_for_path(sysfsPath + optionFile);
        const [success, contents] = file.load_contents(null);
        if (!success) {
            console.error(`Can't write ${optionFile}`);
            return '0';
        }

        const decoder = new TextDecoder('utf-8');
        const contentsString = decoder.decode(contents);

        return contentsString.trim();
    }

    // Write option value to driver file.
    setOptionValue(sysfsPath, optionFile, value) {
        const notificationBody = `${value === true ? _('Enabled') : _('Disabled')} ${_(getOptionName(optionFile))}`;
        const destinationValue = value ? '1' : '0';
        const destinationFile = sysfsPath + optionFile;

        if (this.settings.get_boolean('use-pkexec')) {
            if (this.settings.get_boolean('send-success-notifications'))
                GLib.spawn_command_line_async(`bash -c "pkexec bash -c 'echo ${destinationValue} > ${destinationFile}' && notify-send '${_('Ideapad Controls')}' '${notificationBody}' "`);
            else
                GLib.spawn_command_line_async(`pkexec bash -c 'echo ${destinationValue} > ${destinationFile}'`);
        } else {
            console.log(`Writing string to file ${destinationValue} ${destinationFile}`);
            writeStringToFile(destinationValue, destinationFile);
            if (this.settings.get_boolean('send-success-notifications'))
                notify(_('Ideapad Controls'), notificationBody);
        }
    }
}

