const Buffer = require('safe-buffer').Buffer
const utils = require('ethereumjs-util')

module.exports = {
  fake: true,
  getBlock: function (blockTag, cb) {
    var hash

    if (Buffer.isBuffer(blockTag)) {
      hash = utils.keccak256(blockTag)
    } else if (Number.isInteger(blockTag)) {
      hash = utils.keccak256('0x' + utils.toBuffer(blockTag).toString('hex'))
    } else {
      return cb(new Error('Unknown blockTag type'))
    }

    var block = {
      hash: function () {
        return hash
      }
    }

    cb(null, block)
  },

  delBlock: function (hash, cb) {
    cb(null)
  },

  iterator: function (name, onBlock, cb) {
    cb(null)
  }
}
