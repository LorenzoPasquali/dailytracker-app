#!/bin/bash

fuser -k 3000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

cd service
npm start &
BACKEND_PID=$!

sleep 2

cd ../app
npm run dev

kill $BACKEND_PID
