import crypto from "crypto";
var r;

module.exports = function rand(len) {
  if (!r) r = new Rand(null);

  return r.generate(len);
};

function Rand(rand) {
  this.rand = rand;
}
module.exports.Rand = Rand;

Rand.prototype.generate = function generate(len) {
  return this._rand(len);
};

// if (typeof crypto.randomBytes !== 'function') throw new Error('Not supported')

Rand.prototype._rand = function _rand(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return arr;
};
