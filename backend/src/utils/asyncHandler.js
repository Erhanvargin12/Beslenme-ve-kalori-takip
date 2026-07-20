/**
 * Express route'larında async hataların global middleware'e JSON ile düşmesini sağlar.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
