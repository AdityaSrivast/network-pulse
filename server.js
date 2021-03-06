import url from 'url';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { Helmet as ReactHelmet } from "react-helmet";
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import Main from './main.jsx';
import securityHeaders from './js/security-headers';
import {envUtilities, env } from './js/env-server';

const app = express();

// Find the port we're using. If we're deployed on heroku,
// that information will not be in our config because the
// bundle compilation will have taken place on a different
// dyno from where the code actually runs, but is available
// at runtime as a PORT environment variable
const PORT = env.PORT;

// Define the host that the app expects to serve
const APP_HOST = env.APP_HOST;

// what environment are we running in
const NODE_ENV = env.NODE_ENV;

function renderPage(appHtml,reactHelmet) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta charset="utf-8">
        <script type="text/javascript" async src="https://platform.twitter.com/widgets.js"></script>
        <link rel="apple-touch-icon" type="image/png" sizes="180x180" href="/assets/favicons/apple-touch-icon-180x180@2x.png">
        <link rel="icon" type="image/png" sizes="196x196" href="/assets/favicons/favicon-196x196@2x.png">
        <link rel="shortcut icon" href="/assets/favicons/favicon.ico">
        <link rel="manifest" href="/manifest.json">
        <link rel="stylesheet" type="text/css" href="https://code.cdn.mozilla.net/fonts/zilla-slab.css">
        <link rel="stylesheet" type="text/css" href="/css/mofo-bootstrap.css">
        <link rel="stylesheet" type="text/css" href="/css/font-awesome.min.css">
        <link rel="stylesheet" type="text/css" href="/css/main.css">
        <link rel="alternate"  type="application/rss+xml" href="${env.PULSE_API.replace(`api/pulse`,``)}rss/latest">
        ${reactHelmet.title.toString()}
      </head>
      <body>
        <div id="app">${appHtml}</div>
        <script type="application/json" id="environment-variables">${envUtilities.serializeSafeEnvAsJSON()}</script>
        <script src="/bundle.js"></script>
      </body>
    </html>`;
}

// disable x-powered-by
app.disable(`x-powered-by`);

// Some app security settings
app.use(helmet.contentSecurityPolicy(securityHeaders));

app.use(helmet.xssFilter({
  setOnOldIE: true
}));

// maxAge for HSTS header must be at least 6 months
// (see https://wiki.mozilla.org/Security/Guidelines/Web_Security#HTTP_Strict_Transport_Security)
app.use(helmet.hsts({
  maxAge: 15768000*2, // 12 months in seconds
  setIf: req => req.protocol === `https`,
  includeSubDomains: true,
  preload: true
}));

app.use(helmet.ieNoOpen());

app.use(helmet.noSniff());

app.use(helmet.frameguard({
  action: `deny`
}));

// production specific configuration and middleware
if (NODE_ENV === `production`) {
  // trust x-forwarded-proto headers in production
  app.enable(`trust proxy`);

  // Redirect to the configured hostname & make sure that content is served via on https in production
  app.use((req, res, next) => {
    if (req.headers.host === APP_HOST && req.protocol === `https`) {
      return next();
    }

    return res.redirect(`https://${APP_HOST}${req.url}`);
  });
}

app.use(express.static(path.resolve(__dirname, `dist`)));

if (NODE_ENV !== `development`) {
  app.get(`/admin`, (req, res) => {
    let pulseHost = url.parse(env.PULSE_API);
    res.redirect(`${pulseHost.protocol}//${pulseHost.host}/admin`);
  });
}

app.get(`*`, (req, res) => {
  const reactHelmet = ReactHelmet.renderStatic();
  const context = {}; // context object contains the results of the render

  const appHtml = renderToString(
    <StaticRouter location={req.url} context={context}>
      <Main />
    </StaticRouter>
  );

  if (context.url) {
    // Somewhere a `<Redirect>` was rendered
    res.redirect(301, context.url);
  } else {
    res.status(context.pageNotFound ? 404 : 200).send(renderPage(appHtml, reactHelmet));
  }
});

app.listen(PORT, () => {
  console.log(`\n*******************************************`);
  console.log(`*                                         *`);
  console.log(`*  Network Pulse listening on port ${PORT}   *`);
  console.log(`*                                         *`);
  console.log(`*******************************************\n`);
});
