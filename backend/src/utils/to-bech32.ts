import { bech32m } from "bech32";

function removePrefix(value: string, prefix: string) {
  if (value.startsWith(prefix)) {
    return value.slice(prefix.length);
  }

  return value;
}

export function toBech32m(value: string, prefix: string) {
  if (value.startsWith(prefix)) {
    return value;
  }

  const pureHash = removePrefix(value, "0x");
  const words = bech32m.toWords(Buffer.from(pureHash, "hex"));
  return bech32m.encode(prefix, words);
}

export function encodeBuffer(prefix: string, buffer: Buffer) {
  const words = bech32m.toWords(buffer);
  return bech32m.encode(prefix, words);
}

export function fromBech32m(value: string) {
  const data = bech32m.decode(value);
  return Buffer.from(bech32m.fromWords(data.words)).toString("hex");
}
