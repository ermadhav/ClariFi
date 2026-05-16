-- CreateEnum
CREATE TYPE "RiskAppetite" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "Exchange" AS ENUM ('NSE', 'BSE');

-- CreateEnum
CREATE TYPE "MarketCapType" AS ENUM ('LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MICRO_CAP');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE', 'VOLUME_SPIKE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CapitalGainType" AS ENUM ('STCG', 'LTCG');

-- CreateEnum
CREATE TYPE "BrokerType" AS ENUM ('ZERODHA', 'ANGEL_ONE', 'UPSTOX', 'DHAN', 'FIVE_PAISA', 'GROWW', 'MANUAL');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('WEALTH_CREATION', 'RETIREMENT', 'SHORT_TERM', 'DIVIDEND_INCOME', 'TAX_SAVING', 'EDUCATION', 'HOUSE', 'EMERGENCY_FUND');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "phone" TEXT,
    "image" TEXT,
    "panNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "riskAppetite" "RiskAppetite" NOT NULL DEFAULT 'MODERATE',
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'NSE',
    "companyName" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "marketCap" "MarketCapType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "averagePrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalInvested" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pnlPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dayChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dayChangePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pe" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dividendYield" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "beta" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "high52w" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "low52w" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 0,
    "firstBoughtDate" TIMESTAMP(3) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "holdingId" TEXT,
    "symbol" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'NSE',
    "companyName" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "brokerage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gst" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stampDuty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "broker" TEXT NOT NULL,
    "orderId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_stocks" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'NSE',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "condition" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividends" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "exDate" TIMESTAMP(3) NOT NULL,
    "recordDate" TIMESTAMP(3),
    "paymentDate" TIMESTAMP(3),
    "dividendPerShare" DOUBLE PRECISION NOT NULL,
    "quantityHeld" INTEGER NOT NULL,
    "totalDividend" DOUBLE PRECISION NOT NULL,
    "tdsDeducted" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "financialYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dividends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capital_gains" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "type" "CapitalGainType" NOT NULL,
    "buyDate" TIMESTAMP(3) NOT NULL,
    "sellDate" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "gain" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "financialYear" TEXT NOT NULL,
    "holdingPeriod" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capital_gains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutual_funds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fundName" TEXT NOT NULL,
    "amcCode" TEXT NOT NULL,
    "schemeCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amc" TEXT NOT NULL,
    "folioNumber" TEXT,
    "units" DOUBLE PRECISION NOT NULL,
    "nav" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invested" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "xirr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sipAmount" DOUBLE PRECISION,
    "sipDate" INTEGER,
    "expenseRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating" INTEGER NOT NULL DEFAULT 3,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutual_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "broker" "BrokerType" NOT NULL,
    "clientId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "targetAmount" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_prices" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" "Exchange" NOT NULL DEFAULT 'NSE',
    "price" DOUBLE PRECISION NOT NULL,
    "open" DOUBLE PRECISION,
    "high" DOUBLE PRECISION,
    "low" DOUBLE PRECISION,
    "close" DOUBLE PRECISION,
    "volume" INTEGER,
    "change" DOUBLE PRECISION,
    "changePct" DOUBLE PRECISION,
    "high52w" DOUBLE PRECISION,
    "low52w" DOUBLE PRECISION,
    "marketCap" DOUBLE PRECISION,
    "pe" DOUBLE PRECISION,
    "pb" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_panNumber_key" ON "users"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "holdings_userId_idx" ON "holdings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "holdings_userId_symbol_exchange_key" ON "holdings"("userId", "symbol", "exchange");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_userId_symbol_idx" ON "transactions"("userId", "symbol");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "watchlists_userId_idx" ON "watchlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_stocks_watchlistId_symbol_exchange_key" ON "watchlist_stocks"("watchlistId", "symbol", "exchange");

-- CreateIndex
CREATE INDEX "alerts_userId_idx" ON "alerts"("userId");

-- CreateIndex
CREATE INDEX "alerts_isActive_idx" ON "alerts"("isActive");

-- CreateIndex
CREATE INDEX "dividends_userId_idx" ON "dividends"("userId");

-- CreateIndex
CREATE INDEX "dividends_financialYear_idx" ON "dividends"("financialYear");

-- CreateIndex
CREATE INDEX "capital_gains_userId_idx" ON "capital_gains"("userId");

-- CreateIndex
CREATE INDEX "capital_gains_financialYear_idx" ON "capital_gains"("financialYear");

-- CreateIndex
CREATE INDEX "mutual_funds_userId_idx" ON "mutual_funds"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "broker_accounts_userId_broker_key" ON "broker_accounts"("userId", "broker");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "stock_prices_symbol_idx" ON "stock_prices"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "stock_prices_symbol_exchange_key" ON "stock_prices"("symbol", "exchange");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "holdings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_stocks" ADD CONSTRAINT "watchlist_stocks_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "watchlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capital_gains" ADD CONSTRAINT "capital_gains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutual_funds" ADD CONSTRAINT "mutual_funds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_accounts" ADD CONSTRAINT "broker_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
