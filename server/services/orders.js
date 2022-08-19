'use strict';

const axios = require("axios")

/**
 * Given a dollar amount number, convert it to it's value in cents
 * @param number 
 */
const fromDecimalToInt = (number) => parseInt(number * 100)

const PAYPAL_API = 'https://api-m.sandbox.paypal.com'; // Live https://api-m.paypal.com

const SANDBOX_PAYPAL_API = 'https://api-m.sandbox.paypal.com'
const LIVE_PAYPAL_API = 'https://api-m.paypal.com'

module.exports = {
  find: async function(user) {
    if (!user) {
      return {
        error: true,
        status: "badRequest",
        msg: "User must be authenticated"
      }
    }
    return await strapi.entityService.findMany("plugin::payments.p-order", {
      filters: {
        user: user.id
      },
      sort: {
        id: "desc"
      }
    })
  },
  findOne: async function(user, id) {
    if (!user) {
      return {
        error: true,
        status: "badRequest",
        msg: "User must be authenticated"
      }
    }
    if (id == undefined) {
      return {
        error: true,
        status: "badRequest",
        msg: "An ID must be specified"
      }
    }
    const order = await strapi.entityService.findOne(
      "plugin::payments.p-order",
      id,
      {
        populate: {
          user: {
            fields: ["id"]
          }
        }
      }
    )
    if (order && (order.user.id !== user.id)) {
      return {
        error: true,
        status: "forbidden",
        msg: "This order does not belong to this user"
      }
    }
    return {
      order
    }
  },
  create: async function(params) {

    const { user, payment_method, payload, items } = params

    if (!user) {
      return {
        error: true,
        status: "badRequest",
        msg: "User must be authenticated"
      }
    }
    if (!payment_method) {
      return {
        error: true,
        status: "badRequest",
        msg: "A payment method must be specified"
      }
    }
    if (!["credit_card", "paypal"].includes(payment_method)) {
      return {
        error: true,
        status: "badRequest",
        msg: "Payment method must be either 'credit_card' or 'paypal'"
      }
    }
    let validItems = Array.isArray(items) && items.every(item => {
      return (item.label) && (item.price !== undefined) && (item.quantity) 
    })
    if (!validItems) {
      return {
        error: true,
        status: "badRequest",
        msg: "Invalid format of items"
      }
    }

    let checkout_session
    let total = 0
    let data

    if (payment_method === "credit_card") {
      // Pay with credit card: create order with Stripe
      const stripe = await strapi.service("plugin::payments.stripe").getStripeClient()
      const config = await strapi.service("plugin::payments.stripe").getConfig()
      if (!stripe) {
        console.log("Stripe is not properly configured")
        console.log({config})
        return {
          error: true,
          status: "badRequest",
          msg: "Stripe is not configured"
        }
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: items.map(item => {
          total += (item.price * item.quantity);
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.label
              },
              unit_amount: fromDecimalToInt(item.price),
            },
            quantity: item.quantity,
          };
        }),
        customer_email: user.email,
        mode: "payment",
        success_url: config.success_url,
        cancel_url: config.cancel_url,
      })
      data = session
      checkout_session = session.id
    } else {
      // Pay with PayPal: create order with PayPal
      const paypalAuth = await strapi.service("plugin::payments.paypal").getPaypalAuth()
      const config = await strapi.service("plugin::payments.paypal").getConfig()
      if (!paypalAuth) {
        console.log("PayPal is not properly configured")
        console.log({config})
        return {
          error: true,
          status: "badRequest",
          msg: "PayPal is not properly configured"
        }
      }

      items.map(item => {
        total += (item.price * item.quantity);
      })

      const reqBody = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: total
          }
        }],
        application_context: {
          brand_name: config.brand_name,
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: config.return_url,
          cancel_url: config.cancel_url
        }
      }
      // https://api-m.sandbox.paypal.com/v2/checkout/orders [POST]

      const url = (config.poduction_mode ? PAYPAL_API : SANDBOX_PAYPAL_API)
        .concat("/v2/checkout/orders")

      const user = `${paypalAuth.username}:${paypalAuth.password}`

      try {
        const result = await axios.post(url, reqBody, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(user).toString("base64")}`
          }
        })
        data = result.data
        checkout_session = data.id
      } catch(err) {
        console.log(err)
        return {
          error: true,
          status: "internalServerError",
          msg: "Error while creating paypal order"
        }
      }
    }

    // Create order
    await strapi.entityService.create("plugin::payments.p-order", {
      data: {
        amount: total,
        user: user.id,
        confirmed: false,
        checkout_session,
        payment_method,
        payload,
        response: data,
        items,
      }
    })

    return { id: checkout_session, ...data }
  },
  confirm: async function(params) {

    const { user, checkout_session } = params

    if (!user) {
      return {
        error: true,
        status: "badRequest",
        msg: "User must be authenticated"
      }
    }
    if (!checkout_session) {
      return {
        error: true,
        status: "forbidden",
        msg: "Checkout session must be specified"
      }
    }

    const order = await strapi.db.query("plugin::payments.p-order").findOne({
      where: { checkout_session },
      populate: {
        user: {
          fields: ["id"]
        }
      }
    })

    if (!order) {
      return {
        error: true,
        status: "notFound",
        msg: "Order not found"
      }
    }
    if (order.user.id !== user.id) {
      return {
        error: true,
        status: "forbidden",
        msg: "This order does not belong to this user"
      }
    }

    if (order.confirmed) {
      return order
    }

    if (order.payment_method === "credit_card") {
      let session

      const stripe = await strapi.service("plugin::payments.stripe").getStripeClient()
      if (!stripe) {
        return {
          error: true,
          status: "badRequest",
          msg: "Stripe private key is unset"
        }
      }
      try {
        session = await stripe.checkout.sessions.retrieve(checkout_session)
      } catch(err) {
        return {
          error: true,
          status: "notFound",
          msg: "Checkout ID " + checkout_session + " not found"
        }
      }
      if (session.payment_status !== "paid") {
        return {
          error: true,
          status: "badRequest",
          msg: "Order not verified"
        }
      }
    } else {
      // Capture paypal
      const paypalAuth = await strapi.service("plugin::payments.paypal").getPaypalAuth()
      const config = await strapi.service("plugin::payments.paypal").getConfig()
      if (!paypalAuth) {
        console.log("PayPal is not properly configured")
        console.log({config})
        return {
          error: true,
          status: "badRequest",
          msg: "PayPal is not properly configured"
        }
      }

      let data

      let orderCaptured = false

      const url = (config.poduction_mode ? PAYPAL_API : SANDBOX_PAYPAL_API)
        .concat(`/v2/checkout/orders/${checkout_session}/capture`)

      try {
        const user = `${paypalAuth.username}:${paypalAuth.password}`
        const result = await axios.post(url, {}, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${Buffer.from(user).toString("base64")}`
          }
        })
        orderCaptured = result.data.status === "COMPLETED"
      } catch(err) {
        if (err.response && err.response.data) {
          const { issue } = err.response.data.details[0]
          if (issue === "ORDER_ALREADY_CAPTURED") {
            orderCaptured = true
          } else {
            console.log("Error capturing payment:")
            console.log(JSON.stringify(err.response.data))
          }
        } else {
          console.log("Error capturing payment:")
          console.log(JSON.stringify(err.toJSON()))
        }
      }
      if (!orderCaptured) {
        return {
          error: true,
          status: "badRequest",
          msg: "Unable to verify payment"
        }
      }
    }

    // Mark order as confirmed
    await strapi.entityService.update("plugin::payments.p-order", order.id, {
      data: {
        confirmed: true
      }
    })
    order.confirmed = true
    return order
  }
};
