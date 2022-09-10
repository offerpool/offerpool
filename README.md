# offerpool

A decentralized database of chia offers with a bare bones UI and API.

Anyone can run an instance of offerpool and offers will sync across all instances within seconds via ipfs pub-sub.

In addition to the orbitdb offer table, offers are stored locally in a postgres table with the details of the offer as well as the offer's current status which is maintained by a background job.

## Running locally
1. Install Node v16, Python3, and Chia v1.4+
1. Install and start the [offer helper](https://github.com/offerpool/offer-helper) python service
1. In `./client` run `npm install && npm run build` to build the front end
1. In `./backend` run `docker compose -p offerpool up -d` to start the database and ipfs daemon
1. In `./backend` copy `env.example` to `.env` and change the `CHIA_SSL_DIR` variable to be the full path of your wallet rpc ssl certs directory
1. In `./backend` run `npm start-worker` to start the backend worker process, offers will start to sync to ipfs, initial sync could take 30+ minutes
1. In `./backend` run `npm start` and go to `http://localhost:3000`

## API
### Get Offers
```
GET /api/v1/offers?page_size=[1-100]&page=[1-n]&offered=[cat id or known cat code]&requested=[cat id or known cat code]&valid=[all || true (default) || false]
```

### Add Offer
```
POST /api/v1/offers 
```
```
{
    "offer": "offer1..."
}
```
```
{
    "success": boolean,
    "error_message": "reason for failure if success if false"
}
```
