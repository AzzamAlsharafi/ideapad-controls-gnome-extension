const GObject = imports.gi.GObject;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;

const AggregateMenu = Main.panel.statusArea.aggregateMenu;

var SystemMenu = GObject.registerClass(
    class SystemMenu extends PanelMenu.SystemIndicator {

        _init() {
            super._init();

            // Create extension's sub menu
            this.subMenu = new PopupMenu.PopupSubMenuMenuItem(Me.metadata.name, true);
            this.subMenu.icon.gicon = extensionIcon;

            // Places the extension's sub menu after the battery sub menu if it exists,
            // otherwise places the extension's sub menu at the first spot. (Change later? First spot might be bad idea)
            const menuItems = AggregateMenu.menu._getMenuItems();
            const subMenuIndex = AggregateMenu._power ? (menuItems.indexOf(AggregateMenu._power.menu) + 1) : 0;
            AggregateMenu.menu.addMenuItem(this.subMenu, subMenuIndex);

            addOptionsToMenu(this.subMenu.menu);
        }

        destroy() {
            this.subMenu.destroy();
            super.destroy();
        }
    }
);