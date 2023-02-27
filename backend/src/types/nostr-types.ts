type RelayEvent = "connect" | "disconnect" | "error" | "notice";

export type Relay = {
  url: string;
  status: number;
  connect: () => Promise<void>;
  close: () => void;
  sub: (filters: Filter[], opts?: SubscriptionOptions) => Sub;
  list: (filters: Filter[], opts?: SubscriptionOptions) => Promise<Event[]>;
  get: (filter: Filter, opts?: SubscriptionOptions) => Promise<Event | null>;
  publish: (event: Event) => Pub;
  on: (type: RelayEvent, cb: any) => void;
  off: (type: RelayEvent, cb: any) => void;
};
export type Pub = {
  on: (type: "ok" | "failed", cb: any) => void;
  off: (type: "ok" | "failed", cb: any) => void;
};
export type Sub = {
  sub: (filters: Filter[], opts: SubscriptionOptions) => Sub;
  unsub: () => void;
  on: (type: "event" | "eose", cb: any) => void;
  off: (type: "event" | "eose", cb: any) => void;
};

export type SubscriptionOptions = {
  id?: string;
  skipVerification?: boolean;
  alreadyHaveEvent?: null | ((id: string, relay: string) => boolean);
};

export type Filter = {
  ids?: string[];
  kinds?: number[];
  authors?: string[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[];
};

export type Event = UnsignedEvent & {
  id: string;
  sig: string;
};

export type EventTemplate = {
  kind: Kind;
  tags: string[][];
  content: string;
  created_at: number;
};

export type UnsignedEvent = EventTemplate & {
  pubkey: string;
};

export type Kind = number;
