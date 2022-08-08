'use strict';

module.exports = {
  index(ctx) {
    ctx.body = strapi
      .plugin('Payments')
      .service('myService')
      .getWelcomeMessage();
  },
};
