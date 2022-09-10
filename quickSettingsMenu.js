const GObject = imports.gi.GObject;
const Main = imports.ui.main;

const UIQuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = Main.panel.statusArea.quickSettings; // GNOME 43 System Menu

const SystemMenu = GObject.registerClass(
    class QSystemMenu extends UIQuickSettings.SystemIndicator {

        _init() {
            super._init();

            // Create extension's sub menu
            this.toggleMenu = new UIQuickSettings.QuickMenuToggle({
                label: "IdeaPad", // Not enough space for full name :(
                gicon: extensionIcon
            });

            this.toggleMenu.menu.setHeader(extensionIcon, Me.metadata.name);

            // Since this "toggle" menu isn't being used as a toggle button
            // clicking should just open the menu.
            this.toggleMenu.connect("clicked", () => {
                this.toggleMenu.menu.open();
            })

            QuickSettingsMenu.menu.addItem(this.toggleMenu);

            addOptionsToMenu(this.toggleMenu.menu);
        }

        destroy() {
            this.toggleMenu.destroy();
            super.destroy();
        }
    }
);