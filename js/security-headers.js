import url from 'url';
import { env } from './env-server';

export default {
  directives: {
    defaultSrc: [
      `'none'`
    ],
    scriptSrc: [
      `'self'`,
      `https://*.google-analytics.com`,
      `https://platform.twitter.com/widgets.js`
    ],
    fontSrc: [
      `'self'`,
      `https://code.cdn.mozilla.net`
    ],
    styleSrc: [
      `'self'`,
      `'unsafe-inline'`,
      `https://code.cdn.mozilla.net`
    ],
    imgSrc: [
      `'self'`,
      `data:`,
      `https:`,
      `http:`
    ],
    connectSrc: [
      `'self'`,
      url.parse(env.PULSE_API).host || `https://network-pulse-api-staging.herokuapp.com/`
    ],
    childSrc: [
      `https://syndication.twitter.com`,
      `https://platform.twitter.com`
    ],
    frameAncestors: [
      `'none'`
    ],
    manifestSrc: [
      `'self'`
    ]
  },
  reportOnly: false,
  browserSniff: false
};
