# offerpool

A decentralized database of chia offers with a barebones UI and API.

Requires Node 16.

This is alpha software built over a long weekend, built on top of alpha software (orbitdb) built on top of alpha software (ipfs), but so far, it's working.

Hypothetically, anyone can run an instance and offers should sync across all instances via orbitdb. I've been able to get it working but am only going to pay for one ipfs node to host it right now, so it's possible that it won't get picked up by other ipfs nodes. Reach out on twitter if you are more familiar with ipfs and orbitdb and something is wrong with the code.

Stores the offers in a postgres database to make querying easier.

Environment variables for backend:
```env
PGUSER=<postgres user>
PGHOST=<postgres host>
PGPASSWORD=<postgress password>
PGDATABASE=<postgres databasae name>
PGSCHEMA=<postgres schema name>
PGPORT=<postgres port>
DATABASE_UPDATE_DUPE_LIMIT=<Basically how far to go back in the database after doing a full sync, I'm using 1000 right now>
CHIA_SSL_DIR=<full path to your chia wallet RPC ssl cert directory (e.g. /.../config/ssl/wallet)>
WALLET_RPC_HOST=<host and port of chia wallet rpc, e.g. https://localhost:9257>
MASTER_MULTIADDR=<optional, ipfs address of a known host node to help get synced>
IPFS_HOST=<IPFS daemon host url>
```

API (openapi spec to follow)
Don't abuse the API on offerpool.io. If you need the api, run your own instance and it will sync up with the offers on offerpool.io via orbitdb.
If the endpoint is abused, I will have to figure out how to shut it down, or just take down the site all together, which isn't cool
```
Get Offers - GET /api/v1/offers?page_size=[1-100]&page=[1-n]&offered=[cat id or known cat code]&requested=[cat id or known cat code]&valid=[all || true (default) || false]
Add Offer - POST /api/v1/offers, JSON, {"offer":"<offer string>"}, response: {"success": bool, "error_message": "<message on why adding the offer failed>"}
```
