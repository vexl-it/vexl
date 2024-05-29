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

# check if ./apps/$APP/Dockerfile exists
if [ ! -f "./apps/$APP/Dockerfile" ]; then
    echo "Dockerfile for $APP (./apps/$APP/Dockerfile) does not exist";
    exit 1;
fi

docker build --platform linux/amd64 -t $TAG . -f ./apps/$APP/Dockerfile
