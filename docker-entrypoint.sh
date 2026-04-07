#!/bin/sh
# Ensure the data directory exists and is writable by nextjs (uid 1001)
mkdir -p /app/data
chown nextjs:nodejs /app/data

# Run the app as nextjs
exec su-exec nextjs node server.js
