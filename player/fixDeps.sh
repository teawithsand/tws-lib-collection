#!/bin/bash

# Copies @teawithsand/fstate to local node_modules, so that vite in browser mode can access it
# This script should run before unit testing

mkdir -p ./node_modules/@teawithsand
rm -r ./node_modules/@teawithsand/fstate
mkdir -p ./node_modules/@teawithsand/fstate
cp -r ../node_modules/@teawithsand/fstate/* ./node_modules/@teawithsand/fstate