#!/bin/bash

FILES=$(find www -name '*2x.jpg')

for i in $FILES
do
    OUTPUT=$(echo "$i" | sed "s/@2x.jpg/.jpg/")
    convert $i -resize 1024x768 tmp.jpg && mv tmp.jpg "$OUTPUT"
done
