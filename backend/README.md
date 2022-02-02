# offerpool backend

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
