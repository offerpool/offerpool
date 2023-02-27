# offerpool backend

This is the backend for the offerpool project. It is a REST API written in Node, using Express and Prisma.

## Getting started

Requirements:

- Node.js version 18
- Docker
- Chia Wallet and Full Node

Run `npm install` to install all dependencies.
Run `npx prisma migrate dev` to create the database and run all migrations.
Run `docker compose up -d` to start the Redis instance used for queueing events.
Run `npm run build-client` to build the client.
Copy `.env.example` to `.env` and fill in the values.
Run `npm run dev` to start the server in development mode.
Run `npm run start-worker` to start the worker which updates offer status and fixes up NFTs.
Run `npm run start-nostr` to start the worker which pulls offers from nostr.

Optionally, you can run an IPFS host and run `npm run start-orbitdb` to start the worker which pulls offers from IPFS.

## Deployment

Run `npm run build` to build the project.
Run `npm run start` to start the server in production mode.
