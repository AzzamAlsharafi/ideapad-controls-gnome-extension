const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split(".");
const shellVersion = Number.parseInt(major);

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Common = Me.imports.common;

const UIQuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = Main.panel.statusArea.quickSettings; // GNOME 43 System Menu

var SystemMenu = GObject.registerClass(
    class QSystemMenu extends UIQuickSettings.SystemIndicator {

        _init() {
            super._init();

            // Create extension's sub menu
            this.toggleMenu = new UIQuickSettings.QuickMenuToggle({
                // GNOME 43
                label: "IdeaPad", // Not enough space for full name :(
                // GNOME 44
                title: "IdeaPad",
                gicon: Common.getIcon()
            });

            this.toggleMenu.menu.setHeader(Common.getIcon(), Me.metadata.name);

            // Since this "toggle" menu isn't being used as a toggle button
            // clicking should just open the menu.
            this.toggleMenu.connect("clicked", () => {
                this.toggleMenu.menu.open();
            })

            QuickSettingsMenu.menu.addItem(this.toggleMenu);

            if (shellVersion >= 44) {
                // Move toggleMenu above Background Apps item. (GNOME 44)
                QuickSettingsMenu.menu._grid.set_child_below_sibling(this.toggleMenu, QuickSettingsMenu._backgroundApps.quickSettingsItems[0]);
            }

            Common.addOptionsToMenu(this.toggleMenu.menu);
        }

        destroy() {
            this.toggleMenu.destroy();
            super.destroy();
        }
    }
);