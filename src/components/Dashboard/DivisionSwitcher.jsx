import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../Auth";
import { useNavigate } from "react-router-dom";
import { useDivision } from "../context/DivisionContext";
import styles from "./DivisionSwitcher.module.css";
import { FaExchangeAlt } from "react-icons/fa";

function DivisionSwitcher() {
  const { axiosAPI } = useAuth();
  const navigate = useNavigate();
  const { 
    divisions, 
    selectedDivision, 
    setSelectedDivision, 
    loading: contextLoading,
    reload: reloadDivisions,
    reset: resetDivisions
  } = useDivision();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Only fetch divisions once when component mounts or when user changes
    // Also check if divisions are already loaded to prevent unnecessary API calls
    if (user && divisions.length === 0) {
      reloadDivisions().catch(err => {
        console.error("Failed to load divisions:", err);
        setError("Failed to load divisions");
      });
    }
  }, [user, divisions.length]); // Add divisions.length to prevent unnecessary calls

  // Reset error when divisions load successfully
  useEffect(() => {
    if (divisions.length > 0) {
      setError(null);
    }
  }, [divisions.length]);

  // Listen for division change events
  useEffect(() => {
    const handleDivisionChange = (event) => {
      const { divisionId, division } = event.detail;
      console.log('DivisionSwitcher - Division changed to:', divisionId);
      console.log('DivisionSwitcher - Division details:', division);
      // The context will handle the state update automatically
    };

    window.addEventListener('divisionChanged', handleDivisionChange);
    return () => {
      window.removeEventListener('divisionChanged', handleDivisionChange);
    };
  }, []);
  
  // Add logging for context updates
  useEffect(() => {
    console.log('DivisionSwitcher - Context updated:', {
      selectedDivision,
      selectedDivisionName: selectedDivision?.name,
      selectedDivisionId: selectedDivision?.id,
      divisionsCount: divisions.length,
      timestamp: new Date().toISOString()
    });
  }, [selectedDivision, divisions.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setError(null);
      setLoading(false);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDivisionClick = () => {
    // Navigate to the /divs route instead of reloading the page
    navigate("/divs");
    setIsOpen(false);
  };
  
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    
    // Ensure divisions are loaded when opening
    if (!isOpen && divisions.length === 0) {
      reloadDivisions().catch(console.error);
    }
  };

  // Always show the component if user exists, even if no divisions are loaded yet
  if (!user) {
    return null;
  }

  // Remove console.log statements to prevent console spam
  // console.log("DivisionSwitcher render - divisions:", divisions);
  // console.log("DivisionSwitcher render - selectedDivision:", selectedDivision);

  return (
    <div className={styles.container} ref={dropdownRef}>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '10px', fontSize: '12px' }}>
          {error}
          <button 
            onClick={() => {
              setError(null);
              reloadDivisions().catch(err => {
                console.error("Failed to reload divisions:", err);
                setError("Failed to reload divisions");
              });
            }}
            style={{ marginLeft: '10px', padding: '2px 8px', fontSize: '10px' }}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Desktop View: Full Selector */}
      <div className={styles.selector}>
        <div className={styles.divisionDisplay}>
          <span className={styles.divisionName}>
            {(() => {
              const displayName = contextLoading || loading ? "Loading..." : (selectedDivision?.name || "Select Division");
              return displayName;
            })()}
          </span>
          <button
            className={styles.backArrowButton}
            onClick={handleDivisionClick}
            disabled={contextLoading || loading}
          >
            <span className={styles.backArrow}>
              ←
            </span>
          </button>
        </div>
      </div>

      {/* Mobile View: Icon Switcher */}
      <div className={styles.switcherWrapper}>
        <div 
          className={styles.iconWrapper} 
          onClick={toggleDropdown}
          title="Switch Division"
        >
          <FaExchangeAlt className={styles.switchIcon} />
        </div>
        
        {isOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownHeader}>
              <span>Select Division</span>
            </div>
            
            <div className={styles.dropdownList}>
              {loading || contextLoading ? (
                <div className={styles.dropdownItem}>Loading...</div>
              ) : divisions.length === 0 ? (
                <div className={styles.dropdownItem}>No divisions found</div>
              ) : (
                divisions.map((div) => (
                  <div 
                    key={div.id} 
                    className={`${styles.dropdownItem} ${selectedDivision?.id === div.id ? styles.activeItem : ''}`}
                    onClick={() => {
                      handleDivisionClick();
                    }}
                  >
                    {div.name}
                  </div>
                ))
              )}
            </div>
            
            <div className={styles.dropdownFooter} onClick={handleDivisionClick}>
              Manage Divisions →
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DivisionSwitcher; 