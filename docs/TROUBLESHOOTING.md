# Broker Integration Troubleshooting

### Invalid State Token
**Symptom**: User redirected to `?error=auth_failed` or logs show "Invalid or expired state token".
**Fix**: Ensure `BrokerAuthState` rows are not being deleted by a cleanup script prematurely. State tokens expire in 10 minutes. Also ensure cookies/sessions aren't crossing between browser tabs.

### "Decryption failed"
**Symptom**: Sync API throws error during token decryption.
**Fix**: Ensure `ENCRYPTION_KEY` in `.env` has exactly 64 hex characters (32 bytes) and hasn't changed since the token was saved. If the key changes, all users must re-authenticate their brokers.

### Upstox Refresh Token Failed
**Symptom**: User connected Upstox but sync fails the next day.
**Fix**: Upstox requires refreshing the access token daily. Check the `api/cron/daily-sync` logs. If the refresh token expired, the user must manually re-connect.

### Angel One Login Fails
**Symptom**: "Angel One login failed" during credential submission.
**Fix**: Ensure the user has TOTP enabled on their Angel One account, and that they are providing the correct 6-digit TOTP code.
