#!/bin/zsh

TAG=$1;

# check if tag is define otherwise print error and end script
if [ -z "$TAG" ]; then
    echo "Please provide a tag for the image";
    exit 1;
fi

pwd

docker buildx build --platform linux/amd64 -t $TAG . -f ./apps/notification-service/Dockerfile
