import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './components/Initializer';
import PluginIcon from './components/PluginIcon';
import getTrad from './utils/getTrad';

const name = pluginPkg.strapi.name;

export default {
  register(app) {

    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: getTrad('Settings.section-label'),
          defaultMessage: "Payments plugin"
        }
      },
      [
        {
          intlLabel: {
            id: getTrad('Settings.stripe'),
            defaultMessage: "Stripe"
          },
          id: "stripe",
          to: `/settings/${pluginId}/stripe`,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "users-roles-settings-page" */ './pages/settings/Stripe'
            );
            return component;
          },
          permissions: []
        },
        {
          intlLabel: {
            id: getTrad('Settings.paypal'),
            defaultMessage: "Paypal"
          },
          id: "paypal",
          to: `/settings/${pluginId}/paypal`,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "users-roles-settings-page" */ './pages/settings/Paypal'
            );
            return component;
          },
          permissions: []
        }
      ]
    );

    app.registerPlugin({
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    });
  },

  bootstrap(app) {},
  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map(locale => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
