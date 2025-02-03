#!/bin/bash

echo "Waiting for Debezium to be ready..."
while ! curl -s http://localhost:8083/ > /dev/null; do
    sleep 1
done

echo "Registering PostgreSQL source connector..."
curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" \
    http://localhost:8083/connectors/ -d @debezium-postgres-source.json

echo -e "\nWaiting for source connector to be ready..."
sleep 10

echo "Registering Oracle sink connector..."
curl -i -X POST -H "Accept:application/json" -H "Content-Type:application/json" \
    http://localhost:8083/connectors/ -d @debezium-oracle-sink.json

echo -e "\nConnectors registered successfully!"
