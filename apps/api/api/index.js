const vercelHandler = require('../dist/src/vercel').default;

module.exports = vercelHandler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
