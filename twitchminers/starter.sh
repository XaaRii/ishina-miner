#!/bin/bash
if [ "$1" == "" ]
then
	echo No author ID provided, exiting...
	exit 1
fi
filename="run"$1".py"
tminer="tm-"$1
echo "$filename"
python $filename 2>&1 | tee >(grep -A 1000 "Traceback" > ./templogs/$tminer.err) > /dev/tty || (
	echo "error detected"
	curl -i -H "Accept: application/json" -H "Content-Type:application/json" -X POST --data "{\"content\":\"TMERR$1\"}" "https://discord.com/api/webhooks/1028704305789808753/IJgd3TDiTe-I7latCKsR_0BvQZwyaqeo3HOF2o6v4C0jC6wrRN1g0qqLkEy1shbYqn1i" >/dev/null
	echo "Error webhook sent."
)
