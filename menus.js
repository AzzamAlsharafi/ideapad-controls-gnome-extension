import GObject from 'gi://GObject';
import St from 'gi://St';

import {panel} from 'resource:///org/gnome/shell/ui/main.js';
import {SystemIndicator, QuickMenuToggle} from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {Button as PanelMenuButton} from 'resource:///org/gnome/shell/ui/panelMenu.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const QuickSettingsMenu = panel.statusArea.quickSettings;

export const SystemMenu = GObject.registerClass(
  class QSystemMenu extends SystemIndicator {
      constructor(extension) {
          super();

          // Create extension's sub menu
          this.toggleMenu = new QuickMenuToggle({
              title: 'IdeaPad',
              gicon: extension.icon,
          });

          this.toggleMenu.menu.setHeader(extension.icon, _('IdeaPad Controls'));

          // Since this "toggle" menu isn't being used as a toggle button
          // clicking should just open the menu.
          this.toggleMenu.connect('clicked', () => {
              this.toggleMenu.menu.open();
          });

          QuickSettingsMenu.menu.addItem(this.toggleMenu);
          extension.addOptionsToMenu(this.toggleMenu.menu);
      }

      destroy() {
          this.toggleMenu.destroy();
          super.destroy();
      }
  }
);

export const TrayMenu = GObject.registerClass(
  class TrayMenu extends PanelMenuButton {
      constructor(extension) {
          super(0);

          // Tray icon
          const trayIcon = new St.Icon({
              gicon: extension.icon,
              style_class: 'system-status-icon',
          });

          this.add_child(trayIcon);

          extension.addOptionsToMenu(this.menu);
      }
  }
);

