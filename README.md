# IdeaPad Controls

GNOME Shell extension for controling Lenovo IdeaPad laptops options.

**Available options:** Conservation Mode, Camera Lock, Fn Lock, Touchpad Lock, USB charging.

![Screenshot](images/tray-screenshot.png)



# Installation

Make sure the `gettext` package is installed, or install it with your package manager.

## GNOME Extensions
Install from [GNOME Extensions](https://extensions.gnome.org/extension/5260/ideapad-controls/).

## Manual

First, install `make` using your package manager.

Clone the repo, then execute `make install` inside repo's directory.


# Password-less setup

By default, root permissions are needed to write sysfs nodes used to control ideapad laptop parameters, but this extensions calls `pkexec` which asks for your password everytime to write those files. If you want to make it work without a password, you can follow these instructions.

First, create a group named `ideapad_laptop` and add yourself into that group:
```bash
groupadd ideapad_laptop
usermod -aG ideapad_laptop $USER
```

Then run `sudo make tmpfiles-install` inside repo's directory.

