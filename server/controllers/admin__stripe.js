'use strict'

module.exports = {
  async getStripeConfig(ctx) {
    const config = await strapi.service("plugin::payments.stripe").getConfig()
    ctx.body = { config }
  },
  async setStripeConfig(ctx) {
    const { config } = ctx.request.body
    await strapi.service('plugin::payments.stripe').setConfig(config)
    return { ok: true }
  }
}