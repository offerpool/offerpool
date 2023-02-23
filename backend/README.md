# offerpool backend

Environment variables for back-end:

```env
DATABASE_UPDATE_DUPE_LIMIT=<Basically how far to go back in the database after doing a full sync, I'm using 1000 right now>
MASTER_MULTIADDR=<optional, ipfs address of a known host node to help get synced>
IPFS_HOST=<IPFS daemon host url>
```
