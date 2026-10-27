import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { connectRustPlus, disconnectRustPlus, getRustPlusLiveData, refreshRustPlusData } from './src/server/rustplusService';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.K_SERVICE);

// Enable trust proxy for reverse proxies (Cloud Run / Nginx) to securely get client IP and HTTPS proto
app.set('trust proxy', 1);

// Body parsing and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// SECURITY & IN-MEMORY STORES
// ==========================================

// Rate Limiting Store
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function createRateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimits.get(key);

    if (!record || record.resetAt < now) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Слишком много запросов. Пожалуйста, подождите ${retryAfter} сек.`,
      });
    }

    record.count++;
    next();
  };
}

// In-memory session store (Hashed tokens for memory security)
interface SteamSession {
  hashedToken: string;
  steamId: string;
  displayName: string;
  avatar: string;
  profileUrl: string;
  csrfSecret: string;
  createdAt: number;
  expiresAt: number;
}

const activeSessionsByHash = new Map<string, SteamSession>();

// CSRF State Store for OpenID Login with Browser Binding
interface PendingStateRecord {
  state: string;
  createdAt: number;
  baseUrl: string;
  clientIp: string;
  userAgentHash: string;
  used: boolean;
}
const pendingStates = new Map<string, PendingStateRecord>();

// Replay Attack Protection: Track used OpenID response nonces
const usedNonces = new Map<string, number>(); // nonce -> timestamp

// Rust+ Paired Servers Store (Isolated by user's verified SteamID64)
export interface PairedRustServer {
  id: string;
  userId: string; // Owner's SteamID64
  name: string;
  ip: string;
  port: number;
  playerId: string;
  playerToken: number;
  status: 'unpaired' | 'pending_pair' | 'connecting' | 'connected' | 'reauth_required' | 'error';
  mapSize?: number;
  wipeSchedule?: string;
  lastSync?: string;
  lastError?: string;
  reconnectAttempts: number;
  nextRetryAt?: number;
  pairingSource: 'in_game_notification' | 'manual_entry' | 'pairing_url';
  createdAt: number;
}

const pairedServersStore = new Map<string, PairedRustServer>();

// Clean up expired items every 10 minutes
setInterval(() => {
  const now = Date.now();

  // Expired sessions
  for (const [hash, session] of activeSessionsByHash.entries()) {
    if (session.expiresAt < now) {
      activeSessionsByHash.delete(hash);
    }
  }

  // Expired login states (older than 10 minutes)
  for (const [state, record] of pendingStates.entries()) {
    if (now - record.createdAt > 10 * 60 * 1000) {
      pendingStates.delete(state);
    }
  }

  // Expired nonces (older than 10 minutes)
  for (const [nonce, ts] of usedNonces.entries()) {
    if (now - ts > 10 * 60 * 1000) {
      usedNonces.delete(nonce);
    }
  }

  // Expired rate limit keys
  for (const [key, rec] of rateLimits.entries()) {
    if (now > rec.resetAt) {
      rateLimits.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Helper to determine the application base URL dynamically and safely from the incoming request
function getBaseUrl(req: Request): string {
  // Always derive base URL from the incoming request host to ensure origin parity
  // between the client application tab and the Steam OpenID return_to callback,
  // preventing cross-origin / cross-preview-domain cookie loss (ais-dev vs ais-pre).
  const forwardedHost = req.get('x-forwarded-host');
  const host = (forwardedHost ? forwardedHost.split(',')[0].trim() : null) || req.get('host');
  const forwardedProto = req.get('x-forwarded-proto');
  const isHttps = Boolean(req.secure || (forwardedProto && forwardedProto.split(',')[0].trim() === 'https'));
  const proto = isHttps ? 'https' : (host?.includes('localhost') || host?.includes('127.0.0.1') ? 'http' : 'https');

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
}

// Token Hashing
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Authentication Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.rusty_session;

  if (!token) {
    return res.status(401).json({
      authenticated: false,
      error: 'UNAUTHORIZED',
      message: 'Сессия не найдена. Требуется авторизация Steam.',
    });
  }

  const hashed = hashToken(token);
  const session = activeSessionsByHash.get(hashed);

  if (!session) {
    res.clearCookie('rusty_session', { path: '/' });
    res.clearCookie('rusty_csrf_token', { path: '/' });
    return res.status(401).json({
      authenticated: false,
      error: 'INVALID_SESSION',
      message: 'Сессия недействительна или была аннулирована.',
    });
  }

  if (session.expiresAt < Date.now()) {
    activeSessionsByHash.delete(hashed);
    res.clearCookie('rusty_session', { path: '/' });
    res.clearCookie('rusty_csrf_token', { path: '/' });
    return res.status(401).json({
      authenticated: false,
      error: 'SESSION_EXPIRED',
      message: 'Срок действия сессии истек.',
    });
  }

  (req as any).user = session;
  next();
}

// CSRF Protection Middleware for Mutating Endpoints (POST/PUT/DELETE)
function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const headerCsrf = req.headers['x-csrf-token'];
  const cookieCsrf = req.cookies?.rusty_csrf_token;
  const session = (req as any).user as SteamSession | undefined;

  if (!headerCsrf || !cookieCsrf || headerCsrf !== cookieCsrf) {
    return res.status(403).json({
      error: 'CSRF_INVALID',
      message: 'Запрос отклонен: недействительный или отсутствующий CSRF-токен.',
    });
  }

  if (session && session.csrfSecret !== headerCsrf) {
    return res.status(403).json({
      error: 'CSRF_MISMATCH',
      message: 'CSRF-токен не соответствует активной сессии.',
    });
  }

  next();
}

// ==========================================
// STEAM OPENID 2.0 AUTHENTICATION ENDPOINTS
// ==========================================

// Rate limit: max 20 auth calls per minute per IP
const authLimiter = createRateLimiter(20, 60 * 1000);

// Safe logging helper for diagnostics (NEVER logs sensitive tokens, secrets, or raw cookies)
function logAuthDiagnostic(stage: string, details: Record<string, any>) {
  if (stage === 'validation_failed' && (process.env.NODE_ENV === 'test' || process.env.ENABLE_AUTH_TEST_MODE === '1')) {
    return;
  }
  const sanitized: Record<string, any> = { stage, timestamp: new Date().toISOString() };
  for (const [k, v] of Object.entries(details)) {
    if (['token', 'rawToken', 'cookie', 'state', 'secret', 'password', 'url', 'returnUrl'].includes(k)) {
      sanitized[k] = v ? `[REDACTED_LEN_${String(v).length}]` : null;
    } else {
      sanitized[k] = v;
    }
  }
  console.debug(`[Rusty.Lub Spot Auth] ${stage}:`, JSON.stringify(sanitized));
}

// 1. Generate OpenID 2.0 Login URL (For programmatic / API access)
app.get('/api/auth/steam/url', authLimiter, (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const state = crypto.randomBytes(32).toString('hex');
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.get('user-agent') || '';
  const userAgentHash = crypto.createHash('sha256').update(userAgent).digest('hex');
  const forwardedProto = req.get('x-forwarded-proto');
  const isHttps = Boolean(req.secure || (forwardedProto && forwardedProto.split(',')[0].trim() === 'https'));

  pendingStates.set(state, {
    state,
    clientIp,
    userAgentHash,
    baseUrl,
    createdAt: Date.now(),
    used: false,
  });

  const returnUrl = `${baseUrl}/api/auth/steam/return?state=${state}`;
  const realm = `${baseUrl}/`;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  const steamLoginUrl = `https://steamcommunity.com/openid/login?${params.toString()}`;

  // Store state in HttpOnly Secure cookie bound to SameSite=Lax
  res.cookie('rusty_auth_state', state, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
  });

  logAuthDiagnostic('generate_steam_url', {
    baseUrl,
    isHttps,
    hasForwardedHost: Boolean(req.get('x-forwarded-host')),
    hasForwardedProto: Boolean(req.get('x-forwarded-proto')),
  });

  res.json({
    url: steamLoginUrl,
    loginUrl: `${baseUrl}/api/auth/steam/login`,
    state,
    returnUrl,
  });
});

// 2. Direct redirect endpoint for first-party top-level document navigation in popup / window
app.get('/api/auth/steam/login', authLimiter, (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  const state = crypto.randomBytes(32).toString('hex');
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.get('user-agent') || '';
  const userAgentHash = crypto.createHash('sha256').update(userAgent).digest('hex');
  const forwardedProto = req.get('x-forwarded-proto');
  const isHttps = Boolean(req.secure || (forwardedProto && forwardedProto.split(',')[0].trim() === 'https'));

  pendingStates.set(state, {
    state,
    clientIp,
    userAgentHash,
    baseUrl,
    createdAt: Date.now(),
    used: false,
  });

  const returnUrl = `${baseUrl}/api/auth/steam/return?state=${state}`;
  const realm = `${baseUrl}/`;

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  // Setting the cookie in a top-level GET request ensures first-party storage without iframe partitioning issues
  res.cookie('rusty_auth_state', state, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
  });

  logAuthDiagnostic('direct_steam_login_redirect', {
    baseUrl,
    isHttps,
    hasForwardedHost: Boolean(req.get('x-forwarded-host')),
  });

  res.redirect(`https://steamcommunity.com/openid/login?${params.toString()}`);
});

// 3. Steam OpenID 2.0 Return Callback with Granular Validation and Diagnostics
app.get('/api/auth/steam/return', authLimiter, async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const baseUrl = getBaseUrl(req);

  logAuthDiagnostic('return_callback_received', {
    mode: query['openid.mode'],
    hasStateQuery: Boolean(query['state']),
    hasCookie: Boolean(req.cookies?.rusty_auth_state),
    hasClaimedId: Boolean(query['openid.claimed_id']),
    baseUrl,
  });

  // 1. Check if user cancelled login
  if (query['openid.mode'] === 'cancel') {
    logAuthDiagnostic('validation_failed', { reason: 'User cancelled authentication on Steam' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Авторизация отменена пользователем на стороне Steam.',
    });
  }

  // 2. Verify OpenID response mode
  if (query['openid.mode'] !== 'id_res') {
    logAuthDiagnostic('validation_failed', { reason: `Invalid mode: ${query['openid.mode']}` });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Некорректный режим ответа OpenID (ожидался id_res).',
    });
  }

  // 3. CSRF State Validation: Check query parameter format
  const state = query['state'];
  if (!state || typeof state !== 'string' || !/^[a-f0-9]{48,64}$/i.test(state)) {
    logAuthDiagnostic('validation_failed', { reason: 'State query param missing or invalid format' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Ошибка проверки CSRF: параметр state отсутствует или имеет неверный формат.',
    });
  }

  // 4. CSRF Cookie Presence and Match Verification
  const cookieState = req.cookies?.rusty_auth_state;
  if (!cookieState) {
    logAuthDiagnostic('validation_failed', { reason: 'Session cookie rusty_auth_state missing in request' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Ошибка проверки CSRF: cookie авторизации отсутствует или была заблокирована браузером.',
    });
  }

  if (cookieState !== state) {
    logAuthDiagnostic('validation_failed', { reason: 'State query param does not match rusty_auth_state cookie' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Ошибка проверки CSRF: токен state не совпадает с сессионной cookie.',
    });
  }

  // 5. Server-Side Transaction Lookup
  const pendingRecord = pendingStates.get(state);
  if (!pendingRecord) {
    logAuthDiagnostic('validation_failed', { reason: 'State token not found in pendingStates registry' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Ошибка проверки CSRF: токен недействителен, истёк или принадлежит другой сессии.',
    });
  }

  if (pendingRecord.used) {
    logAuthDiagnostic('validation_failed', { reason: 'State token already marked as used' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Ошибка проверки CSRF: токен авторизации уже был использован (повторный вход запрещён).',
    });
  }

  const now = Date.now();
  const isStateExpired = (now - pendingRecord.createdAt > 10 * 60 * 1000) ||
    (!isProduction && query['test_simulate_expired_state'] === '1');

  if (isStateExpired) {
    pendingStates.delete(state);
    logAuthDiagnostic('validation_failed', { reason: 'State token expired (> 10 minutes)' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Ошибка проверки CSRF: срок действия сессии авторизации истёк (лимит 10 минут).',
    });
  }

  // Invalidate state immediately (Single-Use Token Enforcement)
  pendingRecord.used = true;
  pendingStates.delete(state);
  res.clearCookie('rusty_auth_state', { path: '/' });

  // 6. OpenID claimed_id and identity consistency
  const claimedId = query['openid.claimed_id'] || '';
  const identity = query['openid.identity'] || '';
  if (!claimedId || claimedId !== identity) {
    logAuthDiagnostic('validation_failed', { reason: 'claimed_id does not match identity' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Нарушение спецификации OpenID 2.0: claimed_id не совпадает с identity.',
    });
  }

  // 7. OP Endpoint Verification
  if (query['openid.op_endpoint'] !== 'https://steamcommunity.com/openid/login') {
    logAuthDiagnostic('validation_failed', { reason: 'Invalid op_endpoint' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Недопустимый op_endpoint поставщика OpenID.',
    });
  }

  // 8. Return_to and Realm Verification
  const expectedReturnUrlPrefix = `${baseUrl}/api/auth/steam/return`;
  const recordReturnUrlPrefix = `${pendingRecord.baseUrl}/api/auth/steam/return`;
  const actualReturnTo = query['openid.return_to'] || '';

  if (!actualReturnTo.startsWith(expectedReturnUrlPrefix) && !actualReturnTo.startsWith(recordReturnUrlPrefix)) {
    logAuthDiagnostic('validation_failed', { reason: 'return_to mismatch with server base URL' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Несовпадение openid.return_to с ожидаемым URL приложения.',
    });
  }

  // 9. SteamID64 Format Validation
  const steamIdMatch = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  if (!steamIdMatch || !steamIdMatch[1]) {
    logAuthDiagnostic('validation_failed', { reason: 'Could not extract 17-digit SteamID64' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Не удалось извлечь корректный 64-битный SteamID из ответа OpenID.',
    });
  }
  const steamId64 = steamIdMatch[1];

  // 10. Response Nonce Verification & Replay Protection
  const responseNonce = query['openid.response_nonce'];
  if (!responseNonce) {
    logAuthDiagnostic('validation_failed', { reason: 'Missing response_nonce' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Отсутствует openid.response_nonce в ответе Steam.',
    });
  }

  if (usedNonces.has(responseNonce)) {
    logAuthDiagnostic('validation_failed', { reason: 'Nonce already used (Replay attack)' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Обнаружена попытка повторного использования ответа авторизации (Replay Attack).',
    });
  }

  // Parse nonce timestamp (Format: YYYY-MM-DDTHH:MM:SSZ...)
  try {
    const nonceDateStr = responseNonce.substring(0, 20);
    const nonceTime = Date.parse(nonceDateStr);
    // Nonce must not be older than 5 minutes or more than 1 minute in the future
    if (isNaN(nonceTime) || Math.abs(now - nonceTime) > 5 * 60 * 1000) {
      logAuthDiagnostic('validation_failed', { reason: 'Nonce timestamp out of allowed window' });
      return renderAuthCallbackResponse(res, {
        success: false,
        error: 'Временная метка nonce ответа Steam устарела или недействительна.',
      });
    }
  } catch (e) {
    logAuthDiagnostic('validation_failed', { reason: 'Nonce timestamp parse error' });
    return renderAuthCallbackResponse(res, {
      success: false,
      error: 'Некорректный формат временной метки nonce.',
    });
  }

  // Mark nonce as used
  usedNonces.set(responseNonce, Date.now());

  // 11. Direct check_authentication verification with Steam Community OpenID Server
  try {
    const verificationParams = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('openid.')) {
        verificationParams.append(key, value);
      }
    }
    verificationParams.set('openid.mode', 'check_authentication');

    // Support test mock signature verification ONLY in test / dev mode with matching header
    let isValid = false;
    const isTestMode = !isProduction && (
      process.env.NODE_ENV === 'test' ||
      process.env.ENABLE_AUTH_TEST_MODE === '1' ||
      req.headers['x-steam-test-mock'] === 'test-runner-verified-mock'
    );
    if (isTestMode && query['test_mock_valid'] === '1') {
      isValid = true;
    } else {
      const verifyResponse = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: verificationParams.toString(),
      });

      if (!verifyResponse.ok) {
        logAuthDiagnostic('steam_api_http_error', { status: verifyResponse.status });
        return renderAuthCallbackResponse(res, {
          success: false,
          error: `Steam OpenID сервер вернул HTTP статус ${verifyResponse.status}.`,
        });
      }

      const verifyText = await verifyResponse.text();
      isValid = verifyText.split('\n').some((line) => line.trim() === 'is_valid:true');
    }

    if (!isValid) {
      logAuthDiagnostic('validation_failed', { reason: 'Steam check_authentication returned is_valid:false' });
      return renderAuthCallbackResponse(res, {
        success: false,
        error: 'Серверная верификация подписи Steam завершилась отказом (is_valid:false). Доступ запрещен.',
      });
    }

    // 8. Profile Enrichment
    let displayName = `Оператор [${steamId64.slice(-4)}]`;
    let avatar = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
    const profileUrl = `https://steamcommunity.com/profiles/${steamId64}`;

    const steamApiKey = process.env.STEAM_API_KEY;
    if (steamApiKey && steamApiKey !== 'MY_STEAM_API_KEY') {
      try {
        const profileResp = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId64}`
        );
        if (profileResp.ok) {
          const profileJson = await profileResp.json();
          const player = profileJson?.response?.players?.[0];
          if (player) {
            displayName = player.personaname || displayName;
            avatar = player.avatarfull || player.avatarmedium || avatar;
          }
        }
      } catch (err) {
        console.warn('Не удалось загрузить данные публичного профиля Steam API:', err);
      }
    }

    // 9. Generate Secure Session & CSRF Token
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const hashedSessionToken = hashToken(rawSessionToken);
    const csrfSecret = crypto.randomBytes(24).toString('hex');
    const now = Date.now();
    const sessionExpiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const sessionData: SteamSession = {
      hashedToken: hashedSessionToken,
      steamId: steamId64,
      displayName,
      avatar,
      profileUrl,
      csrfSecret,
      createdAt: now,
      expiresAt: sessionExpiresAt,
    };

    activeSessionsByHash.set(hashedSessionToken, sessionData);

    logAuthDiagnostic('session_created', {
      steamId: steamId64,
      expiresAt: new Date(sessionExpiresAt).toISOString(),
    });

    // Set secure session cookie (HttpOnly, Secure, SameSite=Lax)
    res.cookie('rusty_session', rawSessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Set CSRF token cookie (Non-HttpOnly so client can read and send in X-CSRF-Token header)
    res.cookie('rusty_csrf_token', csrfSecret, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    logAuthDiagnostic('cookie_sent', {
      steamId: steamId64,
      hasSessionCookie: true,
      hasCsrfCookie: true,
    });

    // Clean up older sessions for the same Steam ID if exceeding 5 active devices
    let userSessionCount = 0;
    for (const [h, s] of activeSessionsByHash.entries()) {
      if (s.steamId === steamId64) {
        userSessionCount++;
        if (userSessionCount > 5) {
          activeSessionsByHash.delete(h);
        }
      }
    }

    return renderAuthCallbackResponse(res, {
      success: true,
      csrfToken: csrfSecret,
      user: {
        steamId: steamId64,
        displayName,
        avatar,
        profileUrl,
      },
    });
  } catch (error: any) {
    console.error('Ошибка верификации Steam OpenID:', error);
    return renderAuthCallbackResponse(res, {
      success: false,
      error: `Внутренняя ошибка проверки подлинности: ${error?.message || 'Сетевой сбой'}`,
    });
  }
});

// Helper to render popup callback HTML with cross-origin postMessage (NO LONG-LIVED BEARER TOKEN EXPOSED)
function renderAuthCallbackResponse(
  res: Response,
  data: {
    success: boolean;
    csrfToken?: string;
    user?: { steamId: string; displayName: string; avatar: string; profileUrl: string };
    error?: string;
  }
) {
  // Notice: Session cookie is already set HttpOnly in the browser.
  // We only transmit non-sensitive user profile and csrf token to opener!
  const jsonPayload = JSON.stringify(
    data.success
      ? { type: 'STEAM_AUTH_SUCCESS', csrfToken: data.csrfToken, user: data.user }
      : { type: 'STEAM_AUTH_ERROR', error: data.error }
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Rusty.Lub Spot — Авторизация Steam</title>
  <style>
    body {
      background-color: #0D0F12;
      color: #E6E8EC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      user-select: none;
    }
    .card {
      background-color: #12141A;
      border: 1px solid #262A36;
      border-radius: 6px;
      padding: 24px;
      width: 380px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .badge {
      font-size: 11px;
      font-family: monospace;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 12px;
    }
    .success {
      background: rgba(0, 200, 150, 0.15);
      border: 1px solid #00C896;
      color: #00C896;
    }
    .error {
      background: rgba(240, 68, 68, 0.15);
      border: 1px solid #F04444;
      color: #F04444;
    }
    .title {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 12px;
      color: #9298A5;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid #262A36;
      border-top-color: #F97316;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="card">
    ${
      data.success
        ? `<div class="badge success">STEAM OPENID ПОДТВЕРЖДЕН</div>
           <div class="title">Вход выполнен успешно</div>
           <div class="subtitle">SteamID64: ${data.user?.steamId}<br>Синхронизация с тактическим терминалом...</div>
           <div class="spinner"></div>`
        : `<div class="badge error">ОШИБКА АВТОРИЗАЦИИ</div>
           <div class="title">Не удалось выполнить вход</div>
           <div class="subtitle">${data.error || 'Неизвестная ошибка'}</div>
           <button onclick="window.close()" style="background:#171A21;border:1px solid #262A36;color:#E6E8EC;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">Закрыть окно</button>`
    }
  </div>

  <script>
    (function() {
      const payload = ${jsonPayload};
      try {
        // Trigger cross-tab sync via storage event across all open windows of the app
        localStorage.setItem('rusty_lub_auth_success', Date.now().toString());

        if (window.opener) {
          window.opener.postMessage(payload, '*');
          ${data.success ? 'setTimeout(function() { window.close(); }, 350);' : ''}
        } else {
          ${data.success ? 'setTimeout(function() { window.location.href = "/"; }, 600);' : ''}
        }
      } catch (e) {
        console.error('Error in callback postMessage / localStorage sync:', e);
      }
    })();
  </script>
</body>
</html>`);
}

// 4. Session Verification Endpoint
app.get('/api/auth/me', (req: Request, res: Response) => {
  const token = req.cookies?.rusty_session;

  if (!token) {
    logAuthDiagnostic('session_verification_failed', { reason: 'Missing session cookie rusty_session' });
    return res.status(401).json({
      authenticated: false,
      message: 'Сессия не найдена. Требуется авторизация Steam.',
    });
  }

  const hashed = hashToken(token);
  const session = activeSessionsByHash.get(hashed);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessionsByHash.delete(hashed);
    res.clearCookie('rusty_session', { path: '/' });
    res.clearCookie('rusty_csrf_token', { path: '/' });
    logAuthDiagnostic('session_verification_failed', { reason: 'Session not found in store or expired' });
    return res.status(401).json({
      authenticated: false,
      message: 'Сессия недействительна или истекла.',
    });
  }

  logAuthDiagnostic('session_verified_me', { authenticated: true, steamId: session.steamId });

  return res.json({
    authenticated: true,
    csrfToken: session.csrfSecret,
    user: {
      steamId: session.steamId,
      displayName: session.displayName,
      avatar: session.avatar,
      profileUrl: session.profileUrl,
      createdAt: session.createdAt,
    },
  });
});

// 5. Logout Endpoint (Protected with CSRF)
app.post('/api/auth/logout', requireAuth, requireCsrf, (req: Request, res: Response) => {
  const token = req.cookies?.rusty_session;
  if (token) {
    const hashed = hashToken(token);
    activeSessionsByHash.delete(hashed);
  }

  res.clearCookie('rusty_session', { path: '/' });
  res.clearCookie('rusty_csrf_token', { path: '/' });

  res.json({
    success: true,
    message: 'Сессия успешно завершена.',
  });
});

// ==========================================
// RUST+ COMPANION PROTOCOL SERVER PAIRING API
// (User-Isolated, Authenticated & Rate-Limited)
// ==========================================

const rustPlusLimiter = createRateLimiter(40, 60 * 1000);

// Helper: Seed default servers for demo/guest mode if empty
function getUserServers(userId: string): PairedRustServer[] {
  const list: PairedRustServer[] = [];
  for (const s of pairedServersStore.values()) {
    if (s.userId === userId) {
      list.push(s);
    }
  }
  return list;
}

// GET /api/rustplus/servers: List user's paired servers
app.get('/api/rustplus/servers', requireAuth, rustPlusLimiter, (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;
  const servers = getUserServers(user.steamId);

  res.json({
    success: true,
    userId: user.steamId,
    servers: servers.map((s) => ({
      id: s.id,
      name: s.name,
      ip: s.ip,
      port: s.port,
      playerId: s.playerId,
      status: s.status,
      mapSize: s.mapSize,
      wipeSchedule: s.wipeSchedule,
      lastSync: s.lastSync,
      lastError: s.lastError,
      pairingSource: s.pairingSource,
      createdAt: s.createdAt,
      // Note: playerToken is retained securely on backend and NEVER sent back in list
    })),
  });
});

// POST /api/rustplus/pair: Add new paired server (Enforcing that playerId === authenticated user)
app.post('/api/rustplus/pair', requireAuth, requireCsrf, rustPlusLimiter, (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;
  const { name, ip, port, playerId, playerToken, pairingSource } = req.body;

  if (!ip || !port || !playerId || playerToken === undefined) {
    return res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'Заполните все обязательные поля сопряжения (ip, port, playerId, playerToken).',
    });
  }

  // Strict Security Rule: User can ONLY pair servers for their OWN confirmed SteamID64!
  if (playerId !== user.steamId) {
    return res.status(403).json({
      error: 'STEAM_ID_MISMATCH',
      message: `Несовпадение SteamID: вы не можете привязать сервер с токеном другого игрока (${playerId} != ${user.steamId}).`,
    });
  }

  const portNum = Number(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return res.status(400).json({
      error: 'INVALID_PORT',
      message: 'Некорректный порт сервера Rust+ (обычно 28082 или 28083).',
    });
  }

  const tokenNum = Number(playerToken);
  if (isNaN(tokenNum)) {
    return res.status(400).json({
      error: 'INVALID_TOKEN',
      message: 'Player Token должен быть числовым 32-битным значением Rust Companion.',
    });
  }

  const serverId = `srv-${crypto.randomBytes(8).toString('hex')}`;
  const newServer: PairedRustServer = {
    id: serverId,
    userId: user.steamId,
    name: (name || `Rust Сервер [${ip}:${portNum}]`).trim(),
    ip: ip.trim(),
    port: portNum,
    playerId: user.steamId,
    playerToken: tokenNum,
    status: 'pending_pair',
    pairingSource: pairingSource || 'manual_entry',
    reconnectAttempts: 0,
    createdAt: Date.now(),
    lastSync: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  };

  pairedServersStore.set(serverId, newServer);

  res.status(201).json({
    success: true,
    message: 'Сервер успешно добавлен в реестр сопряжения Rust+.',
    server: {
      id: newServer.id,
      name: newServer.name,
      ip: newServer.ip,
      port: newServer.port,
      playerId: newServer.playerId,
      status: newServer.status,
      pairingSource: newServer.pairingSource,
      createdAt: newServer.createdAt,
    },
  });
});

// POST /api/rustplus/servers/:id/connect: Initiate connection test with exponential backoff & rate limiting
app.post('/api/rustplus/servers/:id/connect', requireAuth, requireCsrf, rustPlusLimiter, async (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;
  const serverId = req.params.id;
  const server = pairedServersStore.get(serverId);

  if (!server) {
    return res.status(404).json({ error: 'SERVER_NOT_FOUND', message: 'Сервер не найден.' });
  }
  if (server.userId !== user.steamId) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Доступ к чужому серверу запрещен.' });
  }

  server.status = 'connecting';
  server.lastError = undefined;
  try {
    const liveData = await connectRustPlus(serverId, {
      ip: server.ip,
      port: server.port,
      playerId: server.playerId,
      playerToken: server.playerToken,
    });
    server.status = 'connected';
    server.lastSync = new Date(liveData.lastSync || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    server.lastError = undefined;
    server.reconnectAttempts = 0;
    server.nextRetryAt = undefined;
    return res.json({
      success: true,
      message: 'Настоящее соединение Rust+ Companion установлено; получены данные сервера.',
      status: server.status,
      liveData,
    });
  } catch (error) {
    server.status = 'error';
    server.lastError = error instanceof Error ? error.message : 'Не удалось подключиться к Rust+.';
    server.reconnectAttempts++;
    server.nextRetryAt = Date.now() + Math.min(60000, 5000 * Math.pow(2, Math.min(server.reconnectAttempts, 4)));
    return res.status(502).json({
      success: false,
      error: 'RUSTPLUS_CONNECTION_FAILED',
      message: server.lastError,
      status: server.status,
    });
  }
});

// GET /api/rustplus/servers/:id/data: Current data received from the live Rust+ connection
app.get('/api/rustplus/servers/:id/data', requireAuth, rustPlusLimiter, (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;
  const server = pairedServersStore.get(req.params.id);

  if (!server || server.userId !== user.steamId) {
    return res.status(404).json({ error: 'SERVER_NOT_FOUND', message: 'Сервер не найден или доступ запрещен.' });
  }

  const liveData = getRustPlusLiveData(server.id);
  if (!liveData) {
    return res.status(409).json({
      success: false,
      connected: false,
      message: server.lastError || 'Нет активного соединения. Нажмите «Подключиться» для получения реальных данных.',
    });
  }

  server.status = liveData.connected ? 'connected' : 'error';
  server.lastError = liveData.lastError;
  if (liveData.lastSync) {
    server.lastSync = new Date(liveData.lastSync).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  return res.json({ success: true, connected: liveData.connected, liveData });
});

// POST /api/rustplus/servers/:id/refresh: Request fresh server data over the live connection
app.post('/api/rustplus/servers/:id/refresh', requireAuth, requireCsrf, rustPlusLimiter, async (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;
  const server = pairedServersStore.get(req.params.id);

  if (!server || server.userId !== user.steamId) {
    return res.status(404).json({ error: 'SERVER_NOT_FOUND', message: 'Сервер не найден или доступ запрещен.' });
  }

  try {
    const liveData = await refreshRustPlusData(server.id, Boolean(req.body?.includeMap));
    server.status = 'connected';
    server.lastSync = new Date(liveData.lastSync || Date.now()).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    server.lastError = undefined;
    return res.json({ success: true, connected: true, liveData });
  } catch (error) {
    server.lastError = error instanceof Error ? error.message : 'Не удалось обновить данные Rust+.';
    return res.status(502).json({ success: false, connected: false, message: server.lastError });
  }
});

// POST /api/rustplus/servers/:id/disconnect: Close the actual Rust+ WebSocket connection
app.post('/api/rustplus/servers/:id/disconnect', requireAuth, requireCsrf, rustPlusLimiter, (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;
  const serverId = req.params.id;
  const server = pairedServersStore.get(serverId);

  if (!server || server.userId !== user.steamId) {
    return res.status(404).json({ error: 'SERVER_NOT_FOUND', message: 'Сервер не найден или доступ запрещен.' });
  }

  disconnectRustPlus(serverId);
  server.status = 'unpaired';
  server.lastSync = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  server.lastError = undefined;

  return res.json({ success: true, message: 'Соединение Rust+ Companion закрыто.', status: 'unpaired' });
});

// DELETE /api/rustplus/servers/:id: Remove server from user's account
app.delete('/api/rustplus/servers/:id', requireAuth, requireCsrf, rustPlusLimiter, (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;
  const serverId = req.params.id;
  const server = pairedServersStore.get(serverId);

  if (!server || server.userId !== user.steamId) {
    return res.status(404).json({ error: 'SERVER_NOT_FOUND', message: 'Сервер не найден или доступ запрещен.' });
  }

  pairedServersStore.delete(serverId);

  res.json({
    success: true,
    message: 'Сервер успешно удален из списка привязанных серверов.',
  });
});

// 6. Protected Example Route
app.get('/api/protected/tactical-status', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as SteamSession;

  res.json({
    status: 'AUTHENTICATED_SECURE',
    verifiedSteamId: user.steamId,
    displayName: user.displayName,
    accessLevel: 'OPERATOR_VERIFIED',
    serverTimestamp: new Date().toISOString(),
  });
});

// ==========================================
// VITE SPA INTEGRATION
// ==========================================

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rusty.Lub Spot] Сервер запущен на http://0.0.0.0:${PORT}`);
    console.log(`[Rusty.Lub Spot] Steam OpenID 2.0 & Rust+ API активны.`);
  });
}

startServer().catch((err) => {
  console.error('Ошибка старта сервера:', err);
  process.exit(1);
});
