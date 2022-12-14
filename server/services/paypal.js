'use strict';

/**
 *  service.
 */

const pluginId = require("../pluginId")

const STORE_KEY = "paypal_config"

module.exports = {
  paypal_auth: null,
  DEFAULT_CONFIG: {
    paypal_client_id: "",
    paypal_client_secret: "",
    brand_name: "",
    return_url: "",
    cancel_url: "",
    production_mode: false
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
      config.paypal_client_id     !== "" &&
      config.paypal_client_secret !== "" &&
      config.brand_name           !== "" &&
      config.return_url           !== "" &&
      config.cancel_url           !== ""
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
    this.setPaypalAuth(newConfig)
  },
  getPaypalAuth: async function() {
    const config = await this.getConfig()

    if (!this.isValidConfig(config)) {
      return null
    }

    if (!this.paypal_auth) {
      this.setPaypalAuth(config)
    }
    return this.paypal_auth
  },
  setPaypalAuth: function(config) {
    if (this.isValidConfig(config)) {
      this.paypal_auth = {
        username: config.paypal_client_id,
        password: config.paypal_client_secret
      }
    }
  }
}
