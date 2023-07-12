#!/bin/bash

current_date=$(date +'%Y%m%d')

backup_dir="./backup"

if [ -d "$backup_dir" ]; then
    echo "Directory exists"
else
    echo "Directory does not exist, creating..."
    mkdir -p "$backup_dir"
    echo "Directory created"
fi

docker exec -it nestjsstockquery-postgres-1 bash -c 'cd /var/lib/postgresql/data && rm -rf '"$current_date"'.dump && pg_dump -Fc postgres > '"$current_date"'.dump'
mv .data/db/"$current_date".dump "$backup_dir/$current_date".dump