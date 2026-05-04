import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./MobileBottomNav.css";

const navItems = [
  { label: "INVOICES",   path: "/invoices",  piIcon: "pi pi-wallet" },
  { label: "CUSTOMERS",  path: "/customers", piIcon: "pi pi-users" },
  { label: "QUOTES",     path: "/quotes",    piIcon: "pi pi-file-edit" },
];


const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Find current active index based on route
  useEffect(() => {
    const idx = navItems.findIndex((item) => item.path === location.pathname);
    if (idx !== -1) setActiveIndex(idx);
  }, [location.pathname]);

  // Move the sliding pill to the active item
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setPillStyle({
          left: elRect.left - parentRect.left,
          width: elRect.width,
        });
      }
    }
  }, [activeIndex]);

  return (
    <nav className="mbn-bar">
      {/* Sliding background pill */}
      <div
        className="mbn-pill"
        style={{ left: pillStyle.left, width: pillStyle.width }}
      />

        {navItems.map((item, idx) => (
          <NavLink
            key={item.label + idx}
            to={item.path}
            ref={(el) => { itemRefs.current[idx] = el; }}
            className={`mbn-item ${activeIndex === idx ? "mbn-item--active" : ""}`}
            onClick={() => setActiveIndex(idx)}
          >
            <div className="mbn-icon-wrap">
              <i className={`${item.piIcon} mbn-icon`} />
            </div>
            <span className="mbn-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
