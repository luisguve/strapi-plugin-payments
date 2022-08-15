'use strict';

module.exports = {
  async getPaypalConfig(ctx) {
    const config = await strapi.service('plugin::payments.paypal').getConfig()
    return { config }
  },
  async setPaypalConfig(ctx) {
    const { config } = ctx.request.body
    await strapi.service('plugin::payments.paypal').setConfig(config)
    return { ok: true }
  }
}
