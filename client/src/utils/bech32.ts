import { bech32m } from "bech32";

function removePrefix(value: string, prefix: string) {
  if (value.startsWith(prefix)) {
    return value.slice(prefix.length);
  }

  return value;
}

const fromHexString = (hexString: any) =>Uint8Array.from(hexString.match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16)));
const toHexString = (bytes: number[]) => bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export function toBech32m(value: string, prefix: string) {
  if (value.startsWith(prefix)) {
    return value;
  }

  const pureHash = removePrefix(value, "0x");
  const words = bech32m.toWords(fromHexString(pureHash));
  return bech32m.encode(prefix, words);
}

export function encodeBuffer(prefix: string, buffer: Buffer) {
  const words = bech32m.toWords(buffer);
  return bech32m.encode(prefix, words);
}

export function fromBech32m(value: string) {
  const data = bech32m.decode(value);
  return toHexString(bech32m.fromWords(data.words));
}
