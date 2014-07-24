#!/bin/bash

for i in $*
do
    ffmpeg -i $i -b:v 500k -an tmp.mp4 && mv tmp.mp4 $i
done
