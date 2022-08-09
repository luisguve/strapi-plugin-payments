'use strict';

module.exports = {
  async getConfig(ctx) {
    const config = await strapi.service('plugin::payments.paypal').getConfig()
    return { config }
  },
  async setConfig(ctx) {
    const { config } = ctx.request.body
    await strapi.service('plugin::payments.paypal').setConfig(config)
    return { ok: true }
  }
}
