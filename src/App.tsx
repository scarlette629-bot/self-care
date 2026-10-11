import { APP_VERSION } from "./lib/version";
import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  Activity,
  RefreshCw,
  Bell,
  CalendarDays,
  CloudOff,
  Download,
  Flower2,
  Home,
  Leaf,
  List,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  TrendingUp,
  User,
  WifiOff,
} from "lucide-react";
import { useStore } from "./lib/store";
import { Empty, Modal, ArrowRight, ChevronRight } from "./components/ui";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Dashboard } from "./features/Dashboard";
import { DataPage } from "./features/DataPage";
import { Trends } from "./features/Trends";
import { Reminders } from "./features/Reminders";
import { Women } from "./features/Women";
import { Preventive } from "./features/Preventive";
import { careReminders } from "./lib/care";
import { taipeiDay } from "./lib/model";
import { EventsPage } from "./features/EventsPage";
import { Timeline } from "./features/Timeline";
import { Profile } from "./features/Profile";
const navigation = [
  { to: "/", name: "健康總覽", short: "首頁", icon: Home },
  { to: "/data", name: "健康數據", short: "數據", icon: Activity },
  { to: "/trends", name: "健康趨勢", short: "趨勢", icon: TrendingUp },
  { to: "/reminders", name: "提醒與行動", short: "提醒", icon: Bell },
  { to: "/profile", name: "我的設定", short: "我的", icon: User },
];
const extra = [
  { to: "/labs", name: "檢驗數據", icon: List },
  { to: "/women", name: "女性健康", icon: Flower2 },
  { to: "/aging", name: "健康老化", icon: Leaf },
  { to: "/preventive", name: "預防保健", icon: ShieldCheck },
  { to: "/timeline", name: "健康時間軸", icon: CalendarDays },
];
import { useMobile } from "./hooks/useMobile";
function App() {
  const mobile = useMobile();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setMenu(false);
  }, [location.pathname]);
  const { data, ready, error, init, commit } = useStore();
  const [menu, setMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [updateMessage, setUpdateMessage] = useState("");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installGuide, setInstallGuide] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  async function checkUpdate() {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    setUpdateMessage("正在檢查更新…");
    try {
      if (!navigator.onLine) throw new Error("請連上網路後再檢查更新。");
      if (!("serviceWorker" in navigator)) throw new Error("此瀏覽器不支援 App 更新。");
      const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
      if (!registration) throw new Error("更新服務尚未就緒，請稍後再試。");
      await registration.update();
      const worker = registration.installing;
      if (worker) await new Promise<void>((resolve, reject) => {
        const finish = () => {
          if (worker.state === "installed" || worker.state === "activated") { cleanup(); resolve(); }
          else if (worker.state === "redundant") { cleanup(); reject(new Error("下載更新失敗，請稍後重試。")); }
        };
        const timeout = window.setTimeout(() => { cleanup(); reject(new Error("檢查逾時，請稍後重試。")); }, 20000);
        const cleanup = () => { window.clearTimeout(timeout); worker.removeEventListener("statechange", finish); };
        worker.addEventListener("statechange", finish);
        finish();
      });
      setUpdateMessage(registration.waiting ? "新版本已就緒。請先儲存正在填寫的資料，再更新 App。" : "目前已是最新版。");
    } catch (e) {
      setUpdateMessage(e instanceof Error ? e.message : "無法檢查更新，請稍後再試。");
    } finally { setCheckingUpdate(false); }
  }
  useEffect(() => {
    void init();
  }, [init]);
  useEffect(() => {
    document.documentElement.dataset.theme = data.settings.dark
      ? "dark"
      : "light";
    document.documentElement.style.fontSize = `${16 * data.settings.font}px`;
  }, [data.settings]);
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  const preference = (change: Partial<typeof data.settings>) =>
    void commit((b) => ({
      ...b,
      settings: { ...b.settings, ...change },
    })).catch(() => {});
  return (
    <>
      <a href="#main" className="skip">
        跳至主要內容
      </a>
      <aside
        className={`sidebar ${menu ? "open" : ""}`}
        inert={mobile && !menu}
      >
        <NavLink to="/" className="brand">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Self-Care" />
          <span>個人健康管理</span>
        </NavLink>
        <div className="sidebar-caption">MY HEALTH SPACE</div>
        <nav aria-label="主要導覽">
          {navigation.slice(0, 3).map((n) => (
            <NavLink
              end={n.to === "/"}
              key={n.to}
              to={n.to}
              onClick={() => setMenu(false)}
            >
              <n.icon size={20} />
              {n.name}
              <ChevronRight size={15} />
            </NavLink>
          ))}
          {extra.slice(0, 4).map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setMenu(false)}>
              <n.icon size={20} />
              {n.name}
            </NavLink>
          ))}
          <div className="nav-divider" />
          {[extra[4], navigation[3], navigation[4]].map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setMenu(false)}>
              <n.icon size={20} />
              {n.name}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="care-message">
            <Leaf size={24} />
            <p>
              每一筆紀錄，
              <br />
              都是對自己的照顧。
            </p>
            <small>LIVE WELL, FEEL BETTER</small>
          </div>
          <button onClick={() => setInstallGuide(true)} className="install">
            <Download size={17} />
            安裝 SELF-CARE
            <ArrowRight size={16} />
          </button>
          <p className="version">SELF-CARE {APP_VERSION} · 本機示範版</p>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-shade"
          aria-label="關閉選單"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="開啟功能選單"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <img className="mobile-logo" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="Self-Care" />
            <span className="mobile-brand-name">SELF-CARE</span>
            <span className="topbar-title">個人健康資料管理</span>
            <span className="topbar-subtitle">
              Personal Health Data Manager
            </span>
          </div>
          <div className="topbar-tools">
            <span className="header-version" aria-label="軟體版本">版本{APP_VERSION}</span>
            {mobile && <button className="icon-button" aria-label="檢查 App 更新" title="檢查更新" disabled={checkingUpdate} onClick={() => void checkUpdate()}><RefreshCw size={18} /></button>}
            <span className="local-state">
              <CloudOff size={16} />
              本機 Demo
            </span>
            <div className="font-tools">
              <button
                aria-label="縮小字級"
                onClick={() =>
                  preference({ font: Math.max(0.9, data.settings.font - 0.1) })
                }
              >
                A−
              </button>
              <button
                aria-label="放大字級"
                onClick={() =>
                  preference({ font: Math.min(1.3, data.settings.font + 0.1) })
                }
              >
                A+
              </button>
            </div>
            <button
              className="icon-button"
              aria-label={data.settings.dark ? "切換淺色模式" : "切換深色模式"}
              onClick={() => preference({ dark: !data.settings.dark })}
            >
              {data.settings.dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NavLink
              to="/reminders"
              className="icon-button notification"
              aria-label="查看提醒"
            >
              <Bell size={20} />
              {(data.reminders.some((r) => !r.done) ||
                careReminders(
                  data.care,
                  data.settings.birthdate,
                  taipeiDay(new Date()),
                ).length > 0) && <i />}
            </NavLink>
            <NavLink to="/profile" className="avatar" aria-label="個人設定">
              <User size={19} />
            </NavLink>
          </div>
        </header>
        {updateMessage && <div className="update-check-status" role="status">
          <span>{updateMessage}</span>
          {needRefresh && <button className="text-button" onClick={() => void updateServiceWorker(true)}>更新 App</button>}
          {!checkingUpdate && <button className="text-button" aria-label="關閉更新訊息" onClick={() => setUpdateMessage("")}>關閉</button>}
        </div>}
        {offline && (
          <div className="status-banner">
            <WifiOff size={16} />
            目前離線 · 仍可操作本機紀錄，沒有雲端同步
          </div>
        )}
        {needRefresh && (
          <div className="status-banner">
            新版本可用
            <button onClick={() => void updateServiceWorker(true)}>
              更新 App
            </button>
          </div>
        )}
        <main id="main">
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {!ready ? (
            <div className="loading">正在讀取本機資料…</div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/data" element={<DataPage key="health" />} />
              <Route path="/labs" element={<DataPage labs key="labs" />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/preventive" element={<Preventive />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/women" element={<Women />} />
              <Route path="/aging" element={<EventsPage key="aging" />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route
                path="*"
                element={
                  <Empty
                    title="找不到此頁面"
                    action={
                      <NavLink to="/" className="button">
                        返回首頁
                      </NavLink>
                    }
                  />
                }
              />
            </Routes>
          )}
          <footer>
            <span>
              SELF-CARE · Understand Your Health. Care for Your Future.
            </span>
            <span>個人健康紀錄工具，不提供醫療診斷</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="手機主要導覽">
        {navigation.map((n) => (
          <NavLink end={n.to === "/"} key={n.to} to={n.to}>
            <n.icon size={21} />
            <span>{n.short}</span>
          </NavLink>
        ))}
      </nav>
      {installGuide && (
        <Modal
          title="將 SELF-CARE 加入主畫面"
          close={() => setInstallGuide(false)}
        >
          <div className="guide">
            <p>正式部署需要 HTTPS。本機可先於 Chrome 或 Edge 驗證 PWA。</p>
            <ol>
              <li>iPhone：以 Safari 開啟 → 分享 → 加入主畫面。</li>
              <li>
                Android／桌面
                Chrome：使用網址列安裝圖示，或選單中的「安裝應用程式」。
              </li>
              <li>
                若沒有安裝選項，請確認使用 HTTPS、Manifest 與 Service Worker
                已載入。
              </li>
            </ol>
            <p className="form-note">
              離線紀錄只儲存在此瀏覽器，未加密且沒有雲端備份；請使用範例資料測試。
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
export default App;
