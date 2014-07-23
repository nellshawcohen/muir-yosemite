#!/bin/sh

DIR=platforms/ios/MuirYosemite/Resources/icons

convert $1 -resize 40x40 $DIR/icon-40.png
convert $1 -resize 80x80 $DIR/icon-40@2x.png
convert $1 -resize 50x50 $DIR/icon-50.png
convert $1 -resize 100x100 $DIR/icon-50@2x.png
convert $1 -resize 60x60 $DIR/icon-60.png
convert $1 -resize 120x120 $DIR/icon-60@2x.png
convert $1 -resize 72x72 $DIR/icon-72.png
convert $1 -resize 144x144 $DIR/icon-72@2x.png
convert $1 -resize 76x76 $DIR/icon-76.png
convert $1 -resize 152x152 $DIR/icon-76@2x.png
convert $1 -resize 29x29 $DIR/icon-small.png
convert $1 -resize 58x58 $DIR/icon-small@2x.png
convert $1 -resize 57x57 $DIR/icon.png
convert $1 -resize 114x114 $DIR/icon@2x.png
