#!/bin/bash
file_name=$1
restore_db=$2
backup_dir="./backup"

cp "$backup_dir/$file_name" .data/db/"$file_name"
docker exec -it nestjsstockquery-postgres-1 bash -c 'cd /var/lib/postgresql/data && pg_restore -h localhost -d '"$restore_db"' '"$file_name"''

rm -rf .data/db/"$file_name"