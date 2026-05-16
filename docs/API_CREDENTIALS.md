# Getting Broker API Credentials

## 1. Zerodha (Kite Connect)
1. Go to [developers.kite.trade](https://developers.kite.trade/).
2. Create an account and buy API credits (₹2000/month).
3. Create a new app.
4. Set the Redirect URL to: `https://your-domain.com/api/brokers/zerodha/callback`.
5. Copy the **API Key** and **API Secret** to your `.env` file.

## 2. Upstox (API v2)
1. Go to [upstox.com/developer/api](https://upstox.com/developer/api/).
2. Login and create an app (Free for personal use).
3. Set the Redirect URL to: `https://your-domain.com/api/brokers/upstox/callback`.
4. Copy the **API Key** and **API Secret**.

## 3. Angel One (SmartAPI)
1. Go to [smartapi.angelbroking.com](https://smartapi.angelbroking.com/).
2. Sign up and click "Create an App".
3. Select "Trading API".
4. Copy the generated **API Key**. Angel One does not use a callback URL for its standard API flow.
