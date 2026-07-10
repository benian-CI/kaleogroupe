// Enveloppe les handlers de routes async pour que toute promesse rejetée
// (erreur DB, service externe en panne, etc.) soit transmise au middleware
// d'erreur Express au lieu de crasher le process (rejet de promesse non capturé).
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
