/*
 *
 * Settings Page
 *
 */

import React, { memo, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { Typography } from '@strapi/design-system/Typography';
import { Status } from '@strapi/design-system/Status';
import { TextInput } from '@strapi/design-system/TextInput';
import { Button } from '@strapi/design-system/Button';
import { Tooltip } from '@strapi/design-system/Tooltip';
import { Stack } from '@strapi/design-system/Stack';
import { Textarea } from '@strapi/design-system/Textarea';
import axios from "../../utils/axiosInstance"

const SettingsPage = () => {
  const [config, setConfig] = useState({
    initial: null,
    current: {
      stripe_pk: null,
      success_url: null,
      cancel_url: null
    }
  })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)
  const url = `/payments/stripe`
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await axios.get(url)
        setConfig({
          ...config,
          initial: data.config
        })
      } catch(err) {
        console.log(err)
        if (!status) {
          setStatus(
            <Status variant="danger">
              <Typography>
                The config could not be loaded. Please check console
              </Typography>
            </Status>
          )
        }
      }
    }
    fetchConfig()
  }, [])
  const handleChange = (param, value) => {
    const newConfig = {
      ...config,
      current: {
        ...config.current,
        [param]: value
      }
    }
    setConfig(newConfig)
  }
  const isNewConfig = () => {
    if (!config.initial) {
      return true
    }

    let stripe_pk = config.current.stripe_pk !== null
    let success_url = config.current.success_url !== null
    let cancel_url = config.current.cancel_url !== null

    if (stripe_pk) {
      stripe_pk = config.current.stripe_pk !== config.initial.stripe_pk
    }
    if (success_url) {
      success_url = config.current.success_url !== config.initial.success_url
    }
    if (cancel_url) {
      cancel_url = config.current.cancel_url !== config.initial.cancel_url
    }
    return (
      stripe_pk || success_url || cancel_url
    )
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (
      !( // at least one of the fields should not be null
        config.current.stripe_pk !== null ||
        config.current.success_url !== null ||
        config.current.cancel_url !== null
      )
    ) {
      return
    }

    const body = {config: {...config.current}}

    let newSuccessUrl = ""

    if ((config.current.success_url !== null) && (config.current.success_url !== "")) {
      newSuccessUrl = body.config.success_url + "?checkout_session={CHECKOUT_SESSION_ID}"
    }

    body.config.success_url = newSuccessUrl

    setSending(true)
    try {
      if (isNewConfig()) {
        await axios.post(url, JSON.stringify(body))
      }
      const newInitial = {...config.current, success_url: newSuccessUrl}
      for (const key in newInitial) {
        if (newInitial[key] === null) {
          delete newInitial[key]
        }
      }
      const newConfig = {
        ...config,
        initial: {...config.initial, ...newInitial}
      }
      setConfig(newConfig)
      setStatus(
        <Status variant="success">
          <Typography>
            The config has been updated correctly
          </Typography>
        </Status>
      )
    } catch(err) {
      console.log(err)
      setStatus(
        <Status variant="danger">
          <Typography>
            The config could not be set. Please check console
          </Typography>
        </Status>
      )
    } finally {
      setSending(false)
    }
  }
  return (
    <Box background="neutral100" padding={8}>
      <Box paddingBottom={3} paddingTop={3}>
        <Typography variant="alpha" fontWeight="bold">Stripe settings</Typography>
      </Box>
      <Box background="neutral0" padding={6}>
        <Stack size={4}>
          <Typography variant="beta">
            Set the following fields if you're accepting payments with credit card
          </Typography>
          <Stack size={0}>
            <Typography variant="epsilon">
              Current configuration:
            </Typography>
            <Typography>
              Private Key: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.stripe_pk ?
                  config.initial.stripe_pk.substr(0,45)+"..." : "not set"
                }
              </Typography>
            </Typography>
            <Typography>
              Success URL: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.success_url || "not set"
                }
              </Typography>
            </Typography>
            <Typography>
              Cancel URL: {" "}
              <Typography fontWeight="bold">
                {
                  !config.initial ? "loading..." :
                  config.initial.cancel_url || "not set"
                }
              </Typography>
            </Typography>
          </Stack>
        </Stack>
        <Box paddingTop={4} paddingBottom={2}>
          <form onSubmit={handleSubmit}>
            <Stack size={2}>
              <TextInput
                label="Private Key"
                name="stripe_pk"
                onChange={e => handleChange("stripe_pk", e.target.value)}
                value={config.current.stripe_pk || ""}
                required={true}
              />
              <TextInput
                label="Success URL"
                name="success_url"
                onChange={e => handleChange("success_url", e.target.value)}
                value={config.current.success_url || ""}
                hint={
                  (config.current.success_url || "{http://your-app.com/payment}") +
                  "    ?checkout_session={CHECKOUT_SESSION_ID}"
                }
                required={true}
              />
              <TextInput
                label="Cancel URL"
                name="cancel_url"
                onChange={e => handleChange("cancel_url", e.target.value)}
                value={config.current.cancel_url || ""}
                hint={
                  config.current.cancel_url || "http://your-app.com"
                }
                required={true}
              />
              <Box>
                <Button
                  type="submit"
                  loading={sending ? true : undefined}
                >Submit</Button>
              </Box>
            </Stack>
          </form>
        </Box>
        {
          status &&
          <Box>
            {status}
          </Box>
        }
      </Box>
    </Box>
  )
};

export default memo(SettingsPage);
