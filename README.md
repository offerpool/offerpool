![offerpool](/client/public//images//logo.svg) 

A decentralized database of chia offers with a bare-bones UI and API.

Anyone can run an instance of offerpool and offers will sync across all instances within seconds via ipfs pub-sub.

In addition to the orbitdb offer table, offers are stored in a local database with the details of the offer as well as the offer's current status. The offer's status is maintained by a background job.

## Running locally
1. Install Node v18, Python3, and Chia v1.7+
1. In `./client` run `npm install && npm run build` to build the front end
1. In `./backend` run `docker compose -p offerpool up -d` to start the ipfs daemon
1. In `./backend` copy `env.example` to `.env` and fill in the values
1. In `./backend` run `npm run build` to compile the TypeScript to Javascript
1. In `./backend` run `npm run start-worker` to start the backend worker process, this will keep offers up to date
1. In `./backend` run `npm run start-worker-sync` to start the backend worker process that syncs offers from orbitdb, initial sync could take 30+ minutes
1. In `./backend` run `npm run start` and go to `http://localhost:3000`

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

## Send Coffee
OfferPool's XCH Address `xch1hk74cqlndr8zv9aqzgnemxhff830t94wu2s0re79n82j09hhwy5qfpy4mm`