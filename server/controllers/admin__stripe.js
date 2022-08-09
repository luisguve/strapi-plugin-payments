'use strict'

module.exports = {
  async getStripePk(ctx) {
    const pk = await strapi.service("plugin::payments.stripe").getStripePk()
    ctx.body = { pk }
  },
  async setStripePk(ctx) {
    const { pk } = ctx.request.body
    await strapi.service('plugin::payments.stripe').setStripePk(pk)
    return { ok: true }
  }
}