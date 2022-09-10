const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;

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
                label: "IdeaPad", // Not enough space for full name :(
                gicon: Common.getIcon()
            });

            this.toggleMenu.menu.setHeader(Common.getIcon(), Me.metadata.name);

            // Since this "toggle" menu isn't being used as a toggle button
            // clicking should just open the menu.
            this.toggleMenu.connect("clicked", () => {
                this.toggleMenu.menu.open();
            })

            QuickSettingsMenu.menu.addItem(this.toggleMenu);

            Common.addOptionsToMenu(this.toggleMenu.menu);
        }

        destroy() {
            this.toggleMenu.destroy();
            super.destroy();
        }
    }
);