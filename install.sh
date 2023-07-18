#!/bin/bash

# Change working directory to project folder
cd "${0%/*}"

echo "Packing extension..."
gnome-extensions pack ./ \
    --extra-source=template.ui \
    --extra-source=optionsUtils.js \
    --extra-source=aggregateMenu.js \
    --extra-source=quickSettingsMenu.js \
    --extra-source=common.js \
    --extra-source=icons/ \
    --extra-source=LICENSE.md \
    --force

echo "Installing extension..."
gnome-extensions install ideapad-controls@azzamalsharafi.gmail.com.shell-extension.zip --force

echo "Extension installed succesfully. Restart the shell (or logout) to be able to enable the extension."