const vercelHandler = require('../apps/api/dist/src/vercel').default;

module.exports = vercelHandler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
