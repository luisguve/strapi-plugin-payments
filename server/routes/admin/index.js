'use strict';

module.exports = {
  type: "admin",
  routes: [
    {
      method: 'GET',
      path: '/stripe',
      handler: 'admin__stripe.getStripeConfig',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/stripe',
      handler: 'admin__stripe.setStripeConfig',
      config: {
        policies: [],
      }
    },
    {
      method: 'GET',
      path: '/paypal',
      handler: 'admin__paypal.getPaypalConfig',
      config: {
        policies: [],
      }
    },
    {
      method: 'POST',
      path: '/paypal',
      handler: 'admin__paypal.setPaypalConfig',
      config: {
        policies: [],
      }
    }
  ]
}