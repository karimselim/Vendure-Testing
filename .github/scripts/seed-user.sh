#!/usr/bin/env bash
# Creates the customer used by the login tests (testing@testing.com) through the Vendure admin API.
set -euo pipefail
API=http://localhost:3000/admin-api
JAR=$(mktemp)
curl -sf -c "$JAR" "$API" -H 'content-type: application/json' \
  -d '{"query":"mutation{login(username:\"superadmin\",password:\"superadmin\"){__typename}}"}' >/dev/null
BODY=$(jq -n --arg pw "$SIGNUP_PASSWORD" '{query:"mutation($pw:String){createCustomer(input:{emailAddress:\"testing@testing.com\",firstName:\"Test\",lastName:\"User\"},password:$pw){__typename ... on ErrorResult{message}}}",variables:{pw:$pw}}')
curl -sf -b "$JAR" "$API" -H 'content-type: application/json' -d "$BODY"
echo
