# EVE Outpost

EVE Outpost is a market and manufacturing manager for [EVE Online](https://www.eveonline.com/). It is aimed at helping EVE industrialists serve small, remote markets.

The app has a server side that routes third-party SSO user authentication, aggregates market data from CCP's game server APIs, and maintains user and data databases. It also serves the client-side web app interface. The app is built to be deployed to [Heroku](https://www.heroku.com).

## Client-Side Technologies
* React.js
* React Router (DOM)
* Semantic-UI

## Server-Side Technologies
* Node.js
* Express
* Passport (session/cookie mgmt, OAuth2)
* Sequelize (PostgreSQL)