#!/bin/bash

mv prime_fetch.json prime_fetch_old.json
python prime_checker.py || (
	echo "error detected"
	cp prime_fetch_old.json prime_fetch.json
	webhook=$(cat "../.cfg.json" | jq -r '.errWebhook')
	curl -i -H "Accept: application/json" -H "Content-Type:application/json" -X POST --data "{\"content\":\"PRIME-ERR\"}" "$webhook" >/dev/null
	echo "Error webhook sent."
)