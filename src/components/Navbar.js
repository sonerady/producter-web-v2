import React, { useState, useEffect } from "react";
import "./Navbar.css";
import {
  RiSearchLine,
  RiSettings4Line,
  RiNotification2Line,
  RiArrowUpSLine,
  RiMenuLine,
  RiUser3Line,
} from "@remixicon/react";
import productorLogo from "../assets/producter-logo.png";

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleUploadClick = () => {
    // Find the file input in the main app and trigger a click on it
    const fileInput = document.getElementById("product-image");
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/">
            <img src={productorLogo} alt="Producter" className="logo-image" />
          </a>
        </div>

        <div className="navbar-links-desktop">
          <a href="/" className="nav-link active">
            Dashboard
          </a>
          <a href="/insights" className="nav-link">
            Insights
          </a>
          <a href="/messages" className="nav-link">
            Messages
          </a>
          <a href="/scheduled" className="nav-link">
            Scheduled
          </a>
          <a href="/integrations" className="nav-link">
            Integrations
          </a>
        </div>

        <div className="navbar-actions">
          <button className="icon-button">
            <RiSearchLine />
          </button>
          <button className="icon-button">
            <RiSettings4Line />
          </button>
          <button className="icon-button">
            <RiNotification2Line />
          </button>
          <button className="icon-button user-icon">
            <RiUser3Line />
          </button>
          <button
            className="mobile-menu-button"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <RiMenuLine className={isMobileMenuOpen ? "open" : ""} />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-links">
            <a href="/" className="mobile-nav-link active">
              Dashboard
            </a>
            <a href="/insights" className="mobile-nav-link">
              Insights
            </a>
            <a href="/messages" className="mobile-nav-link">
              Messages
            </a>
            <a href="/scheduled" className="mobile-nav-link">
              Scheduled
            </a>
            <a href="/integrations" className="mobile-nav-link">
              Integrations
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
