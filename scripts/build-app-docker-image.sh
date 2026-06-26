#!/bin/zsh

# The Dockerfiles use BuildKit features (# syntax directive + RUN --mount=type=cache
# for the pnpm store), so BuildKit must be enabled. It is the default on modern
# Docker, but we set it explicitly so older local Docker versions don't fall back
# to the legacy builder and fail on the cache mounts.
export DOCKER_BUILDKIT=1

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
