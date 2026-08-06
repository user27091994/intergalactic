#!/bin/bash

set -eu

USER=$1
PASSWORD=$2

echo "INSERT INTO users (username, password) VALUES ('${USER}', '$(echo -n $PASSWORD | md5sum | cut -d ' ' -f 1)')"  | sqlite3 web_ui/users.db
