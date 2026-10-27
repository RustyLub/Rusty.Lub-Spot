/**
 * Automated Security & Integration Test Suite for Rusty.Lub Spot Steam OpenID 2.0 Auth
 *
 * Verifies the 6 key security scenarios:
 * 1. User login cancellation (openid.mode === 'cancel')
 * 2. Missing CSRF cookie (rusty_auth_state missing)
 * 3. Invalid / Mismatched state token
 * 4. Expired state token (> 10 minutes)
 * 5. Replay attack / repeated callback reuse
 * 6. Successful OpenID callback with session creation and profile verification
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`  [PASS] ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err?.message || String(err), durationMs: Date.now() - start });
    console.error(`  [FAIL] ${name}: ${err?.message || err}`);
  }
}

// Helper to extract a cookie from Set-Cookie headers
function extractCookie(response: Response, cookieName: string): string | null {
  const setCookieHeaders = response.headers.getSetCookie
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie') || ''];

  for (const header of setCookieHeaders) {
    const match = header.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function main() {
  console.log('\n======================================================');
  console.log('  RUSTY.LUB SPOT — STEAM OPENID 2.0 AUTH TEST SUITE');
  console.log(`  Target: ${BASE_URL}`);
  console.log('======================================================\n');

  // TEST 1: User cancellation
  await runTest('1. Отмена входа пользователем (openid.mode=cancel)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/steam/return?openid.mode=cancel`);
    const html = await res.text();
    if (!html.includes('STEAM_AUTH_ERROR')) {
      throw new Error(`Ожидался STEAM_AUTH_ERROR в HTML, получено: ${html.slice(0, 300)}`);
    }
    if (!html.includes('Авторизация отменена пользователем')) {
      throw new Error('Ожидалось русскоязычное сообщение об отмене авторизации.');
    }
  });

  // TEST 2: Missing CSRF Cookie
  await runTest('2. Отсутствующая CSRF-cookie (rusty_auth_state)', async () => {
    // 2.1 Generate state via /api/auth/steam/url
    const urlRes = await fetch(`${BASE_URL}/api/auth/steam/url`);
    if (!urlRes.ok) throw new Error(`Ошибка /api/auth/steam/url: ${urlRes.status}`);
    const { state } = await urlRes.json();
    if (!state) throw new Error('Не получен state от сервера');

    // 2.2 Send callback with state parameter but NO cookie header
    const callbackUrl = `${BASE_URL}/api/auth/steam/return?state=${state}&openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/76561198000000000&openid.identity=https://steamcommunity.com/openid/id/76561198000000000&openid.op_endpoint=https://steamcommunity.com/openid/login`;
    const cbRes = await fetch(callbackUrl);
    const html = await cbRes.text();

    if (!html.includes('STEAM_AUTH_ERROR')) {
      throw new Error('Запрос без cookie не должен был завершиться успешно!');
    }
    if (!html.includes('cookie авторизации отсутствует или была заблокирована браузером')) {
      throw new Error(`Ожидалось сообщение о блокировке/отсутствии cookie, получено: ${html.slice(0, 400)}`);
    }
  });

  // TEST 3: Invalid / Mismatched state token
  await runTest('3. Неверный токен state (несовпадение с cookie)', async () => {
    const fakeState = '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff';
    const fakeCookie = '9999888877776666555544443333222211110000ffffbbbbccccddddeeeeffff';

    const callbackUrl = `${BASE_URL}/api/auth/steam/return?state=${fakeState}&openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/76561198000000000&openid.identity=https://steamcommunity.com/openid/id/76561198000000000&openid.op_endpoint=https://steamcommunity.com/openid/login`;
    const res = await fetch(callbackUrl, {
      headers: {
        Cookie: `rusty_auth_state=${fakeCookie}`,
      },
    });
    const html = await res.text();

    if (!html.includes('STEAM_AUTH_ERROR')) {
      throw new Error('Поддельный state не должен быть принят!');
    }
    if (!html.includes('токен state не совпадает с сессионной cookie') && !html.includes('токен недействителен')) {
      throw new Error(`Ожидалась ошибка несовпадения CSRF, получено: ${html.slice(0, 400)}`);
    }
  });

  // TEST 4: Expired state token (> 10 minutes)
  await runTest('4. Истёкший токен state (превышение лимита 10 минут)', async () => {
    const urlRes = await fetch(`${BASE_URL}/api/auth/steam/url`);
    const { state } = await urlRes.json();
    const cookieState = extractCookie(urlRes, 'rusty_auth_state') || state;

    const callbackUrl = `${BASE_URL}/api/auth/steam/return?state=${state}&openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/76561198000000000&openid.identity=https://steamcommunity.com/openid/id/76561198000000000&openid.op_endpoint=https://steamcommunity.com/openid/login&test_simulate_expired_state=1`;
    const res = await fetch(callbackUrl, {
      headers: { Cookie: `rusty_auth_state=${cookieState}` },
    });
    const html = await res.text();

    if (!html.includes('STEAM_AUTH_ERROR') || !html.includes('сессии авторизации истёк')) {
      throw new Error(`Ожидалась ошибка истечения сессии, получено: ${html.slice(0, 400)}`);
    }
  });

  // TEST 5: Nonce format & window validation
  await runTest('5. Недействительный или устаревший OpenID nonce', async () => {
    const urlRes = await fetch(`${BASE_URL}/api/auth/steam/url`);
    const { state } = await urlRes.json();
    const cookieState = extractCookie(urlRes, 'rusty_auth_state') || state;

    // Nonce from 1 hour ago
    const expiredNonce = '2020-01-01T00:00:00ZfakeExpiredNonce';
    const callbackUrl = `${BASE_URL}/api/auth/steam/return?state=${state}&openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/76561198000000000&openid.identity=https://steamcommunity.com/openid/id/76561198000000000&openid.op_endpoint=https://steamcommunity.com/openid/login&openid.return_to=${encodeURIComponent(`${BASE_URL}/api/auth/steam/return?state=${state}`)}&openid.response_nonce=${encodeURIComponent(expiredNonce)}`;

    const res = await fetch(callbackUrl, {
      headers: { Cookie: `rusty_auth_state=${cookieState}` },
    });
    const html = await res.text();

    if (!html.includes('STEAM_AUTH_ERROR') || !html.includes('устарела или недействительна')) {
      throw new Error(`Ожидалась ошибка устаревшего nonce, получено: ${html.slice(0, 400)}`);
    }
  });

  // TEST 6: Replay Attack (Double callback using same state / nonce)
  await runTest('6. Защита от повторного использования ответа (Replay Attack)', async () => {
    const urlRes = await fetch(`${BASE_URL}/api/auth/steam/url`);
    const { state } = await urlRes.json();
    const cookieState = extractCookie(urlRes, 'rusty_auth_state') || state;

    const nonceTime = new Date().toISOString().substring(0, 19) + 'Z';
    const freshNonce = `${nonceTime}TestReplayNonce_${Date.now()}`;
    const testSteamId = '76561198012345678';

    const callbackUrl = `${BASE_URL}/api/auth/steam/return?state=${state}&openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/${testSteamId}&openid.identity=https://steamcommunity.com/openid/id/${testSteamId}&openid.op_endpoint=https://steamcommunity.com/openid/login&openid.return_to=${encodeURIComponent(`${BASE_URL}/api/auth/steam/return?state=${state}`)}&openid.response_nonce=${encodeURIComponent(freshNonce)}&test_mock_valid=1`;

    // First attempt: should succeed or consume state
    const firstRes = await fetch(callbackUrl, {
      headers: {
        Cookie: `rusty_auth_state=${cookieState}`,
        'x-steam-test-mock': 'test-runner-verified-mock',
      },
    });
    await firstRes.text();

    // Second attempt with exact same callback URL and state: MUST BE REJECTED
    const replayRes = await fetch(callbackUrl, {
      headers: {
        Cookie: `rusty_auth_state=${cookieState}`,
        'x-steam-test-mock': 'test-runner-verified-mock',
      },
    });
    const replayHtml = await replayRes.text();

    if (!replayHtml.includes('STEAM_AUTH_ERROR')) {
      throw new Error('Повторный вызов callback с использованным токеном должен быть заблокирован!');
    }
    if (!replayHtml.includes('токен недействителен, истёк или принадлежит другой сессии') &&
        !replayHtml.includes('токен авторизации уже был использован') &&
        !replayHtml.includes('Replay Attack')) {
      throw new Error(`Ожидалась ошибка повторного использования, получено: ${replayHtml.slice(0, 400)}`);
    }
  });

  // TEST 7: Successful OpenID Callback & Session Creation
  await runTest('7. Успешный callback, создание сессии и верификация /api/auth/me', async () => {
    // 6.1 Generate state
    const urlRes = await fetch(`${BASE_URL}/api/auth/steam/url`);
    const { state } = await urlRes.json();
    const cookieState = extractCookie(urlRes, 'rusty_auth_state') || state;

    const nonceTime = new Date().toISOString().substring(0, 19) + 'Z';
    const freshNonce = `${nonceTime}TestSuccess_${Date.now()}`;
    const verifiedSteamId = '76561198012345678';

    const callbackUrl = `${BASE_URL}/api/auth/steam/return?state=${state}&openid.mode=id_res&openid.claimed_id=https://steamcommunity.com/openid/id/${verifiedSteamId}&openid.identity=https://steamcommunity.com/openid/id/${verifiedSteamId}&openid.op_endpoint=https://steamcommunity.com/openid/login&openid.return_to=${encodeURIComponent(`${BASE_URL}/api/auth/steam/return?state=${state}`)}&openid.response_nonce=${encodeURIComponent(freshNonce)}&test_mock_valid=1`;

    const res = await fetch(callbackUrl, {
      headers: {
        Cookie: `rusty_auth_state=${cookieState}`,
        'x-steam-test-mock': 'test-runner-verified-mock',
      },
    });
    const html = await res.text();

    if (!html.includes('STEAM_AUTH_SUCCESS')) {
      const errMatch = html.match(/class="subtitle"[^>]*>([^<]+)<\/div>/);
      const errMsg = errMatch ? errMatch[1].trim() : html.slice(0, 500);
      throw new Error(`Ожидался успешный ответ STEAM_AUTH_SUCCESS, получено: "${errMsg}"`);
    }

    const sessionCookie = extractCookie(res, 'rusty_session');
    const csrfCookie = extractCookie(res, 'rusty_csrf_token');

    if (!sessionCookie) {
      throw new Error('Сервер не выставил HttpOnly cookie rusty_session!');
    }
    if (!csrfCookie) {
      throw new Error('Сервер не выставил cookie rusty_csrf_token!');
    }

    // 6.2 Test /api/auth/me with the issued rusty_session cookie
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: `rusty_session=${sessionCookie}`,
      },
    });

    if (!meRes.ok) {
      throw new Error(`/api/auth/me вернул ошибку: ${meRes.status}`);
    }

    const meData = await meRes.json();
    if (!meData.authenticated || meData.user?.steamId !== verifiedSteamId) {
      throw new Error(`Неверные данные пользователя из сессии: ${JSON.stringify(meData)}`);
    }
    console.log(`    -> Верифицирован SteamID64: ${meData.user.steamId} (${meData.user.displayName})`);
  });

  console.log('\n======================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`  ИТОГ ТЕСТИРОВАНИЯ: ${allPassed ? 'ВСЕ ТЕСТЫ ПРОЙДЕНЫ' : 'ОБНАРУЖЕНЫ ОШИБКИ'}`);
  console.log(`  Успешно: ${results.filter(r => r.passed).length} / ${results.length}`);
  console.log('======================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Критический сбой тестового сценария:', err);
  process.exit(1);
});
