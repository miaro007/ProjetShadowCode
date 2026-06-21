"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Bell, History, Star, Settings } from "lucide-react";
import { COLORS } from "@/lib/dashboard-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/i18n";

export default function LeftDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifs" | "history" | "favs" | "settings">("notifs");
  const { t, lang, setLang } = useLanguage();

  const toggleDrawer = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <div 
          className="drawer-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Container */}
      <div className={`left-drawer ${isOpen ? "open" : ""}`}>
        {/* Toggle Button attached to the edge */}
        <button 
          className="drawer-toggle" 
          onClick={toggleDrawer}
          title={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        {/* Drawer Content */}
        <div className="drawer-content">
          <div className="drawer-header">
            <h3>{t("menu.extra")}</h3>
          </div>

          <div className="drawer-nav">
            <button className={`nav-btn ${activeTab === 'notifs' ? 'active' : ''}`} onClick={() => setActiveTab('notifs')}><Bell size={16} /> {t("nav.notifs")}</button>
            <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><History size={16} /> {t("nav.history")}</button>
            <button className={`nav-btn ${activeTab === 'favs' ? 'active' : ''}`} onClick={() => setActiveTab('favs')}><Star size={16} /> {t("nav.favs")}</button>
            <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={16} /> {t("nav.settings")}</button>
          </div>

          <div className="drawer-body scrollable">
            {activeTab === 'notifs' && (
              <div className="tab-panel">
                <div className="panel-title">{t("notifs.title")}</div>
                <div className="notif-item unread">
                  <span className="dot"></span>
                  <div className="notif-text">{t("notifs.1")}</div>
                </div>
                <div className="notif-item">
                  <div className="notif-text">{t("notifs.2")}</div>
                </div>
                <div className="notif-item">
                  <div className="notif-text">{t("notifs.3")}</div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="tab-panel">
                <div className="panel-title">{t("history.title")}</div>
                <div className="hist-item">
                  <div className="hist-route">Ivandry → Analakely</div>
                  <div className="hist-time">{t("history.time.1")}</div>
                </div>
                <div className="hist-item">
                  <div className="hist-route">Ampasika → 67ha</div>
                  <div className="hist-time">{t("history.time.2")}</div>
                </div>
                <div className="hist-item">
                  <div className="hist-route">Tanjombato → Ankorondrano</div>
                  <div className="hist-time">{t("history.time.3")}</div>
                </div>
              </div>
            )}

            {activeTab === 'favs' && (
              <div className="tab-panel">
                <div className="panel-title">{t("favs.title")}</div>
                <div className="fav-item">
                  <Star size={14} className="fav-icon" />
                  <div>
                    <div className="fav-name">{t("favs.home_work")}</div>
                    <div className="fav-route">Ivandry ↔ Analakely</div>
                  </div>
                </div>
                <div className="fav-item">
                  <Star size={14} className="fav-icon" />
                  <div>
                    <div className="fav-name">{t("favs.uni")}</div>
                    <div className="fav-route">Ambohipo ↔ Ankatso</div>
                  </div>
                </div>
                <button className="add-fav-btn">{t("favs.add")}</button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-panel">
                <div className="panel-title">{t("settings.title")}</div>
                
                <div className="setting-row">
                  <span>{t("settings.push")}</span>
                  <input type="checkbox" defaultChecked className="toggle-switch" />
                </div>
                
                <div className="setting-row">
                  <span>{t("settings.eco")}</span>
                  <input type="checkbox" className="toggle-switch" />
                </div>

                <div className="setting-row">
                  <span>{t("settings.voice")}</span>
                  <input type="checkbox" defaultChecked className="toggle-switch" />
                </div>

                <div className="setting-row">
                  <span>{t("settings.lang")}</span>
                  <select 
                    className="setting-select" 
                    value={lang} 
                    onChange={(e) => setLang(e.target.value as Language)}
                  >
                    <option value="fr">Français</option>
                    <option value="mg">Malgache</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .drawer-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 9998;
          backdrop-filter: blur(2px);
          animation: fade-in 0.3s ease;
        }

        .left-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 20%;
          min-width: 280px;
          max-width: 320px;
          background: rgba(10, 14, 26, 0.98);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 20px 0 50px rgba(0,0,0,0.5);
          z-index: 9999;
          transform: translateX(-100%);
          transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
          display: flex;
        }

        .left-drawer.open {
          transform: translateX(0);
        }

        .drawer-toggle {
          position: absolute;
          top: 50%;
          right: -28px;
          width: 28px;
          height: 60px;
          background: rgba(10, 14, 26, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left: none;
          border-radius: 0 12px 12px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          cursor: pointer;
          transform: translateY(-50%);
          box-shadow: 4px 0 15px rgba(0,0,0,0.3);
          transition: all 0.2s;
        }

        .drawer-toggle:hover {
          background: rgba(20, 28, 50, 0.98);
          color: #00E5A0;
          width: 32px;
          right: -32px;
        }

        .drawer-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          color: #fff;
          overflow: hidden;
        }

        .drawer-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .drawer-header h3 {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #00E5A0;
          margin: 0;
        }

        .drawer-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 10px;
          color: rgba(255,255,255,0.6);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .nav-btn.active {
          background: rgba(0, 229, 160, 0.1);
          border-color: #00E5A0;
          color: #00E5A0;
        }

        .drawer-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .panel-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.4);
          margin-bottom: 16px;
        }

        .tab-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fade-in 0.3s ease;
        }

        /* Lists */
        .notif-item, .hist-item, .fav-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .notif-item.unread {
          border-left: 3px solid #00E5A0;
          background: rgba(0,229,160,0.05);
        }

        .notif-item .dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #00E5A0; margin-top: 4px; flex-shrink: 0;
          box-shadow: 0 0 8px #00E5A0;
        }

        .notif-text {
          font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.8);
        }

        .hist-route, .fav-name { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .hist-time, .fav-route { font-size: 11px; color: rgba(255,255,255,0.4); }

        .fav-icon { color: #FFB300; margin-top: 2px; }

        .add-fav-btn {
          margin-top: 8px;
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px dashed rgba(255,255,255,0.2);
          border-radius: 12px;
          color: #fff; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        .add-fav-btn:hover { background: rgba(255,255,255,0.1); border-color: #00E5A0; color: #00E5A0; }

        .setting-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 13px; color: #fff; font-weight: 500;
        }

        .toggle-switch {
          appearance: none;
          width: 40px; height: 22px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          position: relative;
          cursor: pointer;
          outline: none;
          transition: 0.3s;
        }
        .toggle-switch::after {
          content: ''; position: absolute;
          top: 2px; left: 2px;
          width: 18px; height: 18px;
          background: #fff; border-radius: 50%;
          transition: 0.3s;
        }
        .toggle-switch:checked { background: #00E5A0; }
        .toggle-switch:checked::after { left: 20px; }

        .setting-select {
          background: rgba(255,255,255,0.1);
          color: #fff; border: none; border-radius: 6px;
          padding: 6px 10px; font-size: 12px; outline: none;
          cursor: pointer;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
