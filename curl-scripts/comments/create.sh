#!/bin/bash

API="http://localhost:4741"
URL_PATH="/comments"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "comment": {
      "post_id": "'"${POST}"'",
      "text": "'"${TEXT}"'",
      "upvote": "'"${UPVOTE}"'"
    }
  }'

echo
