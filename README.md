# offerpool

A decentralized database of chia offers with a barebones UI and API.

Requires Node 16.

This is alpha software built over a long weekend, built on top of alpha software (orbitdb) built on top of alpha software (ipfs), but so far, it's working.

Anyone can run an instance and offers should sync across all instances via orbitdb.

Stores the offers in a postgres database to make querying easier.

### Running locally
1. Make sure you are using node version 16+ and are running a beta version of the chia wallet that supports offers
2. In `./client` run `npm install && npm run build` to build the front end
3. In `./backend` run `docker compose -p offerpool up -d` to start the database and ipfs daemon
4. In `./backend` copy `env.example` to `.env` and change the `CHIA_SSL_DIR` variable to be the full path of your wallet rpc ssl certs directory
5. In `./backend` run `npm start` and go to `http://localhost:3000`

API (openapi spec to follow)
Don't abuse the API on offerpool.io. If you need the api, run your own instance and it will sync up with the offers on offerpool.io via orbitdb.
If the endpoint is abused, I will have to figure out how to shut it down, or just take down the site all together, which isn't cool
```
Get Offers - GET /api/v1/offers?page_size=[1-100]&page=[1-n]&offered=[cat id or known cat code]&requested=[cat id or known cat code]&valid=[all || true (default) || false]
Add Offer - POST /api/v1/offers, JSON, {"offer":"<offer string>"}, response: {"success": bool, "error_message": "<message on why adding the offer failed>"}
```
