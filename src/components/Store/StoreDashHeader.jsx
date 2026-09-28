import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "../Dashboard/Dashboard.module.css";
import StoreProfileAvatar from "./StoreProfileAvatar";
import SearchBar from "../Dashboard/SearchBar";
import Logo from "../Dashboard/navs/Logo";
import StoreSwitcher from "./StoreSwitcher";
import Notification from "../Dashboard/Notification";
import { storeOptions } from "../../utils/searchOptions";
import { FaSearch, FaTimes } from "react-icons/fa";

function StoreDashHeader({
  notifications,
  onNotificationClick,
  onMarkAllNotificationsRead,
  user,
  setTab,
  admin,
  orgadmin,
}) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Mobile header layout: Logo + Brand centered, Search + Profile on right
  if (isMobile) {
    return (
      <>
        <div className={styles.header}>
          <div className={`row ${styles.mobileHeaderRow}`} style={{ width: '100%', margin: 0 }}>
            {/* Left spacer for hamburger menu */}
            <div className={styles.mobileHeaderSpacer}></div>
            
            {/* Centered logo + brand - Hide when search is open */}
            {!showMobileSearch && (
              <div className={styles.mobileHeaderCenter} style={{ justifyContent: 'flex-start' }}>
                <Logo />
                <p className={styles.brand}>Feed Bazaar Pvt Ltd</p>
              </div>
            )}
            
            {/* Right: Search only (Profile moved to navbar on mobile) */}
            <div className={`col-auto ${styles.headcontent}`} style={showMobileSearch ? { width: '100%', maxWidth: '100%', flex: '1 1 auto', paddingLeft: '5px', paddingRight: '2px', overflow: 'visible' } : {}}>
              <div className={styles.headerRight} style={{ width: '100%', justifyContent: showMobileSearch ? 'flex-start' : 'flex-end' }}>
                
                {/* Search Toggle Logic */}
                {showMobileSearch ? (
                  /* Removing styles.searchContainer when expanded to bypass max-width !important constraint in CSS */
                  <div style={{ width: '100%', maxWidth: '100%', flex: 1, display: 'flex', alignItems: 'center', gap: '0' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <SearchBar options={storeOptions} isExpanded={true} />
                    </div>
                    <button 
                      onClick={() => setShowMobileSearch(false)}
                      style={{ background: 'none', border: 'none', color: '#666', fontSize: '18px', padding: '0 5px', flexShrink: 0 }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowMobileSearch(true)}
                    style={{ 
                      position: 'fixed',
                      top: '10px', // Adjusted to align with top: 5px switcher
                      right: '90px', // Increased spacing from right to avoid overlap with auto-width switcher
                      zIndex: 1002,
                      background: 'transparent', 
                      border: 'none', 
                      width: '40px', 
                      height: '40px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#666',
                    }}
                  >
                    <FaSearch size={22} />
                  </button>
                )}
                
                {/* Hide Switcher when search is open */}
                {!showMobileSearch && (
                  <div style={{ display: "flex", alignItems: "center", marginRight: 10 }}>
                    <Notification
                      notifications={notifications || []}
                      onItemClick={onNotificationClick}
                      onMarkAllRead={onMarkAllNotificationsRead}
                      emptyLabel="No store alerts"
                    />
                  </div>
                )}

                {!showMobileSearch && (
                  <div className={styles.storeContainer}>
                    <StoreSwitcher />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop header layout (unchanged)
  return (
    <>
      <div className={styles.header}>
        <div className="row justify-content-between align-items-center" style={{ width: '100%', margin: 0 }}>
          <div className={`col-auto ${styles.headcontentTitle}`}>
            <p className={styles.brand}>Feed Bazaar Pvt Ltd</p>
          </div>
          <div className={`col-auto ${styles.headcontent}`}>
            <div className={styles.headerRight}>
              <div className={styles.searchContainer}>
                <SearchBar options={storeOptions} />
              </div>
              
              <div className={styles.storeContainer}>
                <StoreSwitcher />
              </div>

              <div style={{ display: "flex", alignItems: "center" }}>
                <Notification
                  notifications={notifications || []}
                  onItemClick={onNotificationClick}
                  onMarkAllRead={onMarkAllNotificationsRead}
                  emptyLabel="No store alerts"
                />
              </div>
              
              <div className={styles.profileContainer}>
                <StoreProfileAvatar user={user} setTab={setTab} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default StoreDashHeader;
