# IdeaPad Controls

GNOME Shell extension for controling Lenovo IdeaPad laptops options.

**Available options:** Conservation Mode, Camera Lock, Fn Lock, Touchpad Lock, USB charging.

**Settings window:**

![Settings screenshot](images/settings-screenshot.png)

**Tray mode:**

![Tray screenshot](images/tray-screenshot.png)

**System menu mode:**

![System menu screenshot](images/system-menu-screenshot.png)



# Installation

## GNOME Extensions
Install from [GNOME Extensions](https://extensions.gnome.org/extension/5260/ideapad-controls/).

## Manual
Clone the repo then execute `install.sh` script.


# Password-less setup

By default, root permissions are needed to write sysfs nodes used to control ideapad laptop parameters and this extensions calls `pkexec` which asks for your password to write those files. If you want to make it work without a password, you can follow these instructions.

First, create a group named `ideapad_laptop` and add yourself into that group:
```bash
groupadd ideapad_laptop
usermod -aG ideapad_laptop $USER
```

Then, copy `99-ideapad.conf` (from the root of this repository) to `/etc/tmpfiles.d` and reboot your system.

