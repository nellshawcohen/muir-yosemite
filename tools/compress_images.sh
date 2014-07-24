#!/bin/bash

for i in $*
do
    convert $i  -quality 50 tmp.jpg && mv tmp.jpg $i
done
