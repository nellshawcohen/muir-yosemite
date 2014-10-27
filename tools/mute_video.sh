#!/bin/bash

for i in $*
do
    ffmpeg -i $i -an tmp.mp4 && mv tmp.mp4 $i
done
