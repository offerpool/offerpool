const { bech32m } = require('bech32');

function removePrefix(value, prefix) {
    if (value.startsWith(prefix)) {
        return value.slice(prefix.length);
    }

    return value;
}

function toBech32m(value, prefix) {
    if (value.startsWith(prefix)) {
        return value;
    }

    const pureHash = removePrefix(value, '0x');
    const words = bech32m.toWords(Buffer.from(pureHash, 'hex'));
    return bech32m.encode(prefix, words);
}

function fromBech32m(value) {
    const data = bech32m.decode(value);
    return Buffer.from(bech32m.fromWords(data.words)).toString('hex');
}

module.exports.toBech32m = toBech32m;
module.exports.fromBech32m = fromBech32m;