'use strict';

/**
 *  service.
 */

const stripe = require('stripe')
const pluginId = require("../pluginId")

const STORE_KEY = "stripe_config"

module.exports = {
  stripe_client: null,
  DEFAULT_CONFIG: {
    stripe_pk: "",
    success_url: "",
    cancel_url: ""
  },
  /**
   * Retrieve the strapi data storage for this portion of the plugin
   */
  getStore: function() {
    return strapi.store({
      type: "plugin",
      name: pluginId
    })
  },
  isValidConfig: function(config) {
    return (
      config.stripe_pk     !== "" &&
      config.success_url   !== "" &&
      config.cancel_url    !== ""
    )
  },
  getConfig: async function() {
    const pluginStore = this.getStore()
    const config = await pluginStore.get({ key: STORE_KEY })
    if (!config) {
      return this.DEFAULT_CONFIG
    }
    return config
  },
  setConfig: async function(newConfigInput) {
    const config = await this.getConfig()
    for (const key in newConfigInput) {
      if (newConfigInput[key] === null) {
        delete newConfigInput[key]
      }
    }
    const newConfig = {...config, ...newConfigInput}
    const pluginStore = this.getStore()
    pluginStore.set({ key: STORE_KEY, value: newConfig})
    this.setStripeClient(newConfig)
  },
  getStripeClient: async function() {
    const config = await this.getConfig()

    if (!this.isValidConfig(config)) {
      return null
    }

    if (!this.stripe_client) {
      this.setStripeClient(config)
    }
    return this.stripe_client
  },
  setStripeClient: function(config) {
    if (this.isValidConfig(config)) {
      this.stripe_client = new stripe(config.stripe_pk)
    }
  }
}
