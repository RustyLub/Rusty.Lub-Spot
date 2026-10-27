import React from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  X,
  Lock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { useCompanion } from '../context/CompanionContext';

export const SteamLoginModal: React.FC = () => {
  const {
    steamUser,
    steamAuthState,
    steamAuthError,
    showLoginModal,
    setShowLoginModal,
    loginWithSteam,
    logoutSteam,
    isGuestMode,
    setIsGuestMode,
  } = useCompanion();

  if (!showLoginModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-lg bg-[#12141A] border border-[#262A36] rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-[#262A36] bg-[#0D0F12] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#F97316] flex items-center justify-center font-bold text-white text-xs font-mono shadow-sm">
              R.L.
            </div>
            <div>
              <div className="font-bold text-[#E6E8EC] text-sm tracking-wider font-mono">
                RUSTY.LUB SPOT
              </div>
              <div className="text-[10px] text-[#9298A5] font-mono">
                АВТОРИЗАЦИЯ ОПЕРАТОРА // VALVE STEAM OPENID 2.0
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowLoginModal(false);
              setIsGuestMode(true);
            }}
            className="p-1.5 text-[#9298A5] hover:text-[#E6E8EC] hover:bg-[#171A21] rounded transition-colors"
            title="Закрыть (Остаться в гостевом режиме)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* STATE 1: ALREADY AUTHENTICATED */}
          {steamAuthState === 'authenticated' && steamUser ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded bg-[#171A21] border border-[#00C896]/40 flex items-center gap-3.5">
                <img
                  src={steamUser.avatar}
                  alt={steamUser.displayName}
                  className="w-12 h-12 rounded border border-[#262A36] shrink-0"
                  onError={(e) => {
                    // Fallback avatar
                    (e.target as HTMLImageElement).src =
                      'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#E6E8EC] text-sm truncate">
                      {steamUser.displayName}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00C896]/15 text-[#00C896] border border-[#00C896]/30 font-bold shrink-0">
                      ПОДТВЕРЖДЕН
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#9298A5] mt-0.5 flex items-center gap-1.5">
                    <span>SteamID64:</span>
                    <span className="text-[#E6E8EC] font-semibold">{steamUser.steamId}</span>
                  </div>
                  <a
                    href={steamUser.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#F97316] hover:underline flex items-center gap-1 mt-1 font-mono"
                  >
                    Открыть профиль в Steam Community <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <div className="p-3 bg-[#171A21] border border-[#262A36] rounded font-mono text-[11px] text-[#9298A5] space-y-1">
                <div className="text-[#E6E8EC] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00C896]" />
                  <span>Статус криптографической сессии:</span>
                </div>
                <div>• Проверка подписи Valve OpenID 2.0: <strong>УСПЕШНО (is_valid:true)</strong></div>
                <div>• Серверный защищенный токен сессии: <strong>АКТИВЕН (HttpOnly / SameSite)</strong></div>
                <div>• Доступ к персональному трекеру и координатам отряда: <strong>РАЗРЕШЕН</strong></div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => logoutSteam()}
                  className="px-3 py-2 rounded bg-[#171A21] hover:bg-[#262A36] text-[#F04444] border border-[#F04444]/40 font-mono text-xs flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Выйти из аккаунта
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  Продолжить работу <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : steamAuthState === 'logging_in' ? (
            /* STATE 2: LOGGING IN (WAITING FOR OPENID POPUP) */
            <div className="py-6 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-[#262A36] border-t-[#F97316] animate-spin" />
                <Lock className="w-6 h-6 text-[#F97316] absolute" />
              </div>

              <div>
                <div className="font-bold text-[#E6E8EC] text-sm font-mono mb-1">
                  ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ STEAM OPENID...
                </div>
                <div className="text-[11px] text-[#9298A5] max-w-sm mx-auto leading-relaxed">
                  Пожалуйста, подтвердите авторизацию в открывшемся окне <strong>steamcommunity.com</strong>.
                  Сервер выполнит проверку цифровой подписи OpenID.
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => loginWithSteam()}
                  className="px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#E6E8EC] border border-[#262A36] font-mono text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-[#F97316]" /> Открыть окно повторно
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGuestMode(true);
                    setShowLoginModal(false);
                  }}
                  className="px-3 py-1.5 rounded bg-[#171A21] hover:bg-[#262A36] text-[#9298A5] border border-[#262A36] font-mono text-[11px] transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3: DEFAULT UNCONNECTED OR ERROR */
            <div className="space-y-4">
              {/* Error banner if present */}
              {steamAuthError && (
                <div className="p-3 rounded bg-[#261515] border border-[#F04444]/60 text-xs text-[#E6E8EC] flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#F04444] shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="font-bold text-[#F04444] font-mono">
                      ОШИБКА ПРОВЕРКИ ПОДЛИННОСТИ STEAM
                    </div>
                    <div className="text-[#9298A5] text-[11px] leading-relaxed">
                      {steamAuthError}
                    </div>
                    <a
                      href="/api/auth/steam/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#F97316] hover:bg-[#E05326] text-white font-mono text-[11px] font-bold transition-colors mt-1 shadow-sm"
                    >
                      Открыть Steam вход в новой вкладке <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Informational Hero Card */}
              <div className="p-3.5 rounded bg-[#171A21] border border-[#262A36] space-y-2">
                <div className="text-[11px] text-[#E6E8EC] leading-relaxed font-sans">
                  Авторизация в <strong>Rusty.Lub Spot</strong> выполняется через протокол <strong>Valve Steam OpenID 2.0</strong> с последующей серверной криптографической верификацией ответа.
                </div>
                <div className="space-y-1.5 text-[11px] font-mono text-[#9298A5] pt-1">
                  <div className="flex items-center gap-1.5 text-[#00C896]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Пароль от Steam передается только серверу Valve (мы его не видим)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#00C896]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Сервер проверяет подпись Steam и фиксирует подтвержденный SteamID64</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#00C896]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Защита от подделки идентификатора через secure HttpOnly сессии</span>
                  </div>
                </div>
              </div>

              {/* Notice regarding Rust+ Separation */}
              <div className="p-2.5 rounded bg-[#0D0F12] border border-[#262A36] text-[10px] font-mono text-[#9298A5] flex items-start gap-2">
                <Radio className="w-3.5 h-3.5 text-[#F97316] shrink-0 mt-0.5" />
                <div>
                  <strong>Важно:</strong> Вход через Steam удостоверяет аккаунт игрока. Доступ к управлению устройствами Rust+ (Companion API) и GPS-координатам на сервере настраивается отдельно через pairing-токен в разделе «Настройки».
                </div>
              </div>

              {/* STEAM LOGIN BUTTON (Official Valve OpenID 2.0 Style) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => loginWithSteam()}
                  className="w-full py-3 px-4 rounded bg-[#171A21] hover:bg-[#1E232F] text-white border-2 border-[#262A36] hover:border-[#F97316] transition-all flex items-center justify-center gap-3 shadow-lg group cursor-pointer"
                >
                  {/* Official Steam vector icon */}
                  <svg className="w-6 h-6 fill-current text-white group-hover:text-[#F97316] transition-colors" viewBox="0 0 24 24">
                    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0zM7.54 18.216c0-.001 0-.003 0-.005l-1.787-.738c.288.533.78 1.002 1.408 1.261 1.05.435 2.253-.06 2.686-1.109.213-.514.195-1.077-.024-1.543l-1.834-.757c-.157.073-.332.115-.515.115-1.071 0-1.942-.87-1.942-1.943 0-.153.029-.297.062-.439L3.807 12.35c-.015.147-.024.296-.024.447 0 2.495 2.028 4.523 4.524 4.523.447 0 .873-.069 1.275-.192-.68.683-1.611 1.088-2.042 1.088zm8.4-9.308c-1.392 0-2.52 1.13-2.52 2.522 0 1.391 1.128 2.522 2.52 2.522 1.393 0 2.52-1.131 2.52-2.522 0-1.392-1.127-2.522-2.52-2.522zm0 1.008c.836 0 1.512.677 1.512 1.514 0 .837-.676 1.514-1.512 1.514-.836 0-1.512-.677-1.512-1.514 0-.837.676-1.514 1.512-1.514z" />
                  </svg>
                  <span className="font-mono font-bold text-sm tracking-wider">
                    ВОЙТИ ЧЕРЕЗ STEAM
                  </span>
                </button>
              </div>

              {/* Guest mode fallback button */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsGuestMode(true);
                    setShowLoginModal(false);
                  }}
                  className="text-[#9298A5] hover:text-[#E6E8EC] font-mono text-[11px] transition-colors underline-offset-4 hover:underline"
                >
                  Продолжить в ознакомительном режиме без Steam (Гость)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
