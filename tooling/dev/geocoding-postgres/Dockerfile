FROM postgres:17

RUN apt-get update \
  && apt-get install --no-install-recommends --yes postgresql-17-postgis-3 \
  && rm -rf /var/lib/apt/lists/*
