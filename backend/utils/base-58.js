const BASE58CharacterSet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const base58 = require('base-x')(BASE58CharacterSet)

module.exports.base58 = base58;