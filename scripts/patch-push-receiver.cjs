const fs = require('node:fs');

const requestModulePath = require.resolve(
  '@liamcottle/push-receiver/src/utils/request',
);

const patchedRequestModule = `const request = require('request-promise');
const { waitFor } = require('../timeout');

// Retry only failures that may recover without changing credentials.
// HTTP 4xx (including 401) are permanent and must be returned immediately.
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 15000];
const RETRYABLE_NETWORK_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'EPIPE',
]);

module.exports = requestWithRetry;

async function requestWithRetry(...args) {
  return retry(0, ...args);
}

async function retry(retryCount, ...args) {
  try {
    return await request(...args);
  } catch (error) {
    const statusCode = Number(error && error.statusCode);
    const code = error && error.code;
    const retryable =
      (Number.isInteger(statusCode) &&
        (statusCode === 429 || statusCode >= 500)) ||
      RETRYABLE_NETWORK_CODES.has(code);

    if (!retryable || retryCount >= MAX_RETRIES) {
      throw error;
    }

    const delay = RETRY_DELAYS[retryCount];
    console.warn(
      '[push-receiver] Request failed (' +
        (statusCode || code || 'network error') +
        '); retry ' + (retryCount + 1) + '/' + MAX_RETRIES +
        ' in ' + delay + 'ms.',
    );
    await waitFor(delay);
    return retry(retryCount + 1, ...args);
  }
}
`;

const current = fs.readFileSync(requestModulePath, 'utf8');
if (current.includes('RETRYABLE_NETWORK_CODES')) {
  console.log('[push-receiver] Retry patch already applied.');
  process.exit(0);
}
if (!current.includes('module.exports = requestWithRety;')) {
  throw new Error(
    'Unexpected push-receiver request module; refusing to overwrite an unknown version.',
  );
}

fs.writeFileSync(requestModulePath, patchedRequestModule, 'utf8');
console.log('[push-receiver] Installed bounded retry patch (401 is not retried).');
