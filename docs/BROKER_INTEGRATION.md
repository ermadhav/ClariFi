# Broker Integration Guide

## Overview
ClariFi integrates with multiple Indian stock brokers to fetch live portfolio data (holdings, positions, orders, and funds).

## Supported Brokers
1. **Zerodha (Kite Connect v3)** - OAuth2 flow, access tokens valid for 1 day. No refresh tokens.
2. **Upstox (API v2)** - OAuth2 flow, access tokens valid for 1 day, refresh tokens supported.
3. **Angel One (SmartAPI v1)** - Credential-based authentication + TOTP.

## Architecture

- **`BrokerAPI` Interface**: Defined in `src/lib/apis/brokers/base-broker.ts`. Ensures all brokers implement `getHoldings()`, `getPositions()`, etc.
- **Token Management**: Tokens are encrypted using AES-256-GCM before being stored in PostgreSQL. Encryption logic is in `src/lib/encryption.ts`.
- **Sync Logic**: The `POST /api/brokers/sync` endpoint handles fetching and transforming broker data into the application's unified schema.

## Authentication Flow (OAuth)
1. User clicks "Connect" on the Settings page.
2. Next.js API generates an auth URL (with a random state string saved in the DB) and redirects the user.
3. User approves access on the broker portal.
4. Broker redirects to `GET /api/brokers/[name]/callback`.
5. Next.js verifies the state string to prevent CSRF.
6. The callback exchanges the authorization code for an `access_token` and encrypts it into the `BrokerAccount` table.

## Cron Jobs
A Vercel Cron Job runs at `0 18 * * *` (6:00 PM IST daily) to automatically sync all portfolios post-market hours.
