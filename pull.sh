#!/bin/sh
cp config.json config.json.bak
git pull
mv config.json.bak config.json
