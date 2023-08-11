const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Gettext = imports.gettext;


const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Common = Me.imports.common;

const Domain = Gettext.domain(Me.metadata.uuid);
const { gettext, ngettext } = Domain;
const _ = gettext;

const AggregateMenu = Main.panel.statusArea.aggregateMenu;

var SystemMenu = GObject.registerClass(
    class SystemMenu extends PanelMenu.SystemIndicator {

        _init() {
            super._init();

            // Create extension's sub menu
            this.subMenu = new PopupMenu.PopupSubMenuMenuItem(Me.metadata.name, true);
            this.subMenu.icon.gicon = Common.getIcon();

            // Places the extension's sub menu after the battery sub menu if it exists,
            // otherwise places the extension's sub menu at the first spot. (Change later? First spot might be bad idea)
            const menuItems = AggregateMenu.menu._getMenuItems();
            const subMenuIndex = AggregateMenu._power ? (menuItems.indexOf(AggregateMenu._power.menu) + 1) : 0;
            AggregateMenu.menu.addMenuItem(this.subMenu, subMenuIndex);

            Common.addOptionsToMenu(this.subMenu.menu);
        }

        destroy() {
            this.subMenu.destroy();
            super.destroy();
        }
    }
);
