'use strict';

module.exports = {
  type: "admin",
  routes: [
    {
      method: 'GET',
      path: '/stripe-pk',
      handler: 'admin__stripe.getStripePk',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/stripe-pk',
      handler: 'admin__stripe.setStripePk',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/paypal',
      handler: 'admin__paypal.getConfig',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/paypal',
      handler: 'admin__paypal.setConfig',
      config: {
        policies: [],
      }
    }
  ]
}