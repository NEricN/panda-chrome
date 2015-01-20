#!bin/bash
shopt -s extglob
echo -ne "Minifying extension..."\\r
mkdir -p build/

echo -ne "Copying locales..."\\r
cp -r _locales build/_locales

echo -ne "Copying css..."\\r
mkdir -p build/css/
cp css/main.css build/css/main.css

echo -ne "Copying images..."\\r
cp -r icons/ build/icons/

echo -ne "Copying js files..."\\r
mkdir -p build/js/
cp js/content.min.js build/js/content.min.js
cp js/main.min.js build/js/main.min.js

echo -ne "Copying manifest..."\\r
cp manifest.json build/manifest.json

echo -ne "Copying src directory..."\\r
mkdir -p build/src/
cp -r src/ build/src/
rm -f build/src/bg/background.js

find build/ -name '*.DS_Store' -type f -delete
echo -ne "Minifying extension finished."\\n