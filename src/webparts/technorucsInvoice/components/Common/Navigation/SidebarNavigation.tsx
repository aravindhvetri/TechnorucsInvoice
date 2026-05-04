import * as React from "react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./SidebarNavigation.css";
import MobileBottomNav from "./MobileBottomNav";

import logoImg from "../../../assets/images/technorucslogo.png";

interface ISidebarNavigationProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Invoices", path: "/invoices", piIcon: "pi pi-wallet" },
  { name: "Customers", path: "/customers", piIcon: "pi pi-users" },
  { name: "Quotes", path: "/quotes", piIcon: "pi pi-file-edit" },
];

const SidebarNavigation: React.FC<ISidebarNavigationProps> = ({ children }) => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const toggleDesktopSidebar = () => setIsDesktopCollapsed(!isDesktopCollapsed);

  return (
    <div className="app-container">
      {/* Mobile Top Header
      <div className="mobile-header">
        <div className="mobile-logo-area">
          <img src={logoImg} alt="Technorucs" className="mobile-logo-image" />
        </div>
      </div> */}

      {/* Desktop Sidebar */}
      <nav className={`sidebar ${isDesktopCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <img src={logoImg} alt="Technorucs" className="logo-image" />

          <button
            className="desktop-toggle-btn"
            onClick={toggleDesktopSidebar}
            title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle sidebar"
          >
            <i
              className={`pi ${isDesktopCollapsed ? "pi-chevron-right" : "pi-chevron-left"} toggle-chevron`}
            />
          </button>
        </div>

        <div className="nav-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <div className="nav-item-icon" title={item.name}>
                <i className={item.piIcon} />
              </div>
              <span className="nav-item-label">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="main-content">
        <div className="main-content-inner">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default SidebarNavigation;
