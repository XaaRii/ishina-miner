#!/bin/bash
if [ "$1" == "" ]
then
	echo No author ID provided, exiting...
	exit 1
fi
filename="run"$1".py"
tminer="tm-"$1
echo "$filename"
python $filename || (
	echo "error detected"
	webhook=$(cat "../.cfg.json" | jq -r '.errWebhook')
	curl -i -H "Accept: application/json" -H "Content-Type:application/json" -X POST --data "{\"content\":\"TMERR$1\"}" "$webhook" >/dev/null
	echo "Error webhook sent."
)
