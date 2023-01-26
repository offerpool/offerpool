export const table_exists =
  "SELECT EXISTS ( \
    SELECT FROM information_schema.tables \
    WHERE  table_schema = $1 \
    AND    table_name   = $2 \
    );";

// TODO: use flyway for migrations
export const create_table = (table_name) => `
create table "${table_name}"
(
	id bigserial
		constraint "${table_name}_pk"
			primary key,
	hash bytea,
	offer text,
	status smallint,
	offered_cats text[],
	requested_cats text[],
	parsed_offer jsonb
);

create unique index "${table_name}_hash_uindex"
	on "${table_name}" (hash);

create index "${table_name}_status_index"
	on "${table_name}" (status);

	create index "${table_name}_offered_cats_requested_cats_index"
	on "${table_name}" (offered_cats, requested_cats);

create index "${table_name}_requested_cats_offered_cats_index"
	on "${table_name}" (requested_cats, offered_cats);

create table "${table_name}_cats_info"
(
	id text
		constraint "${table_name}_cats_info_pk"
			primary key,
	name text,
	code text,
	mojos_per_coin bigint
);

insert into "${table_name}_cats_info"(id, "name", code, mojos_per_coin) VALUES
('xch', 'Chia', 'XCH', 1000000000000),
('509deafe3cd8bbfbb9ccce1d930e3d7b57b40c964fa33379b18d628175eb7a8f', 'Chia Holiday 2021', 'CH21', 1000),
('78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1', 'Spacebucks', 'SBX', 1000),
('8ebf855de6eb146db5602f0456d2f0cbe750d57f821b6f91a8592ee9f1d4cf31', 'Marmot Coin', 'MRMT', 1000),
('6d95dae356e32a71db5ddcb42224754a02524c615c5fc35f568c2af04774e589', 'Stably USD', 'USDS', 1000)
;

create table "${table_name}_requested_cat"
(
    offer_id bigint not null,
    cat_id   text   not null,
    constraint "${table_name}_requested_cat_pkey"
        primary key (offer_id, cat_id)
);

create index "${table_name}_requested_cat_cat_id_index"
    on "${table_name}_requested_cat" (cat_id);

create table "${table_name}_offered_cat"
(
	offer_id bigint not null,
	cat_id   text   not null,
	constraint "${table_name}_offered_cat_pkey"
		primary key (offer_id, cat_id)
);

create index "${table_name}_offered_cat_cat_id_index"
    on "${table_name}_offered_cat" (cat_id);
`;

export const create_nft_table = (table_name) => 
`create table "${table_name}_nft_info"
(
    launcher_id varchar
        constraint "${table_name}_nft_info_pk" primary key,
    nft_id     varchar,
    nft_info   text,
	success    boolean,
    minter_did_id varchar,
	collection_id varchar
);

create index "${table_name}_nft_info_success_index"
  on "${table_name}_nft_info" (success);

create index "${table_name}_nft_info_collection_did_index"
  on "${table_name}_nft_info" (collection_id, minter_did_id);
`
