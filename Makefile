EXTENSION_ZIP := ideapad-controls@azzamalsharafi.gmail.com.shell-extension.zip

subprojects:
	@git submodule update --resursive

template.ui: subprojects
	@./subprojects/blueprint-compiler/blueprint-compiler.py compile template.blp > template.ui

$(EXTENSION_ZIP): template.ui
	@gnome-extensions pack ./ \
    		--extra-source=template.ui \
		--extra-source=optionsUtils.js \
		--extra-source=aggregateMenu.js \
		--extra-source=quickSettingsMenu.js \
		--extra-source=common.js \
		--extra-source=icons/ \
		--extra-source=LICENSE.md \
		--podir=po \
		--force

translations:
	@xgettext \
		--files-from=po/POTFILES \
		--output=po/ideapat-controls.pot \
		--from-code=UTF-8 \
		--add-comments \
		--keyword=_ \
		--keyword=C_:1c,2

install: $(EXTENSION_ZIP)
	@echo "Installing extension"
	gnome-extensions install --force $(EXTENSION_ZIP)
	@echo "Extension installed"

clean:
	rm -f $(EXTENSION_ZIP)

all: install

