#!/bin/zsh

APP=$1;
TAG=$2;

# check if tag is define otherwise print error and end script
if [ -z "$TAG" ]; then
    echo "Please provide a tag for the image";
    exit 1;
fi

# check if APP is define otherwise print error and end script
if [ -z "$APP" ]; then
    echo "Please provide app to build - directory inside apps/ folder";
    exit 1;
fi

# check if ./apps/$APP directory exists
if [ ! -d "./apps/$APP" ]; then
    echo "App $APP (./apps/$APP) does not exist";
    exit 1;
fi

docker build --platform linux/amd64 -t $TAG . -f ./Dockerfile --build-arg APP=$APP
