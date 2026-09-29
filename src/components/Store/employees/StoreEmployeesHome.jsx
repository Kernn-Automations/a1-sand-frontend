import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";
import "./StoreEmployeesHome.module.css";

export default function StoreEmployeesHome() {
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

  const [stats] = useState({
    total: 0,
    managers: 0,
    staff: 0,
    presentToday: 0,
    onLeave: 0,
  });

  return (
    <div className={`store-employees-home ${isMobile ? 'mobile' : ''}`} style={{ padding: isMobile ? '12px 8px' : '20px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
        <h2 style={{ 
          fontFamily: 'Poppins', 
          fontWeight: 700, 
          fontSize: isMobile ? '22px' : '28px', 
          color: 'var(--primary-color)',
          margin: 0,
          marginBottom: '8px'
        }}>Employee Management</h2>
        <p style={{ 
          fontFamily: 'Poppins', 
          fontSize: isMobile ? '12px' : '14px', 
          color: '#666',
          margin: 0
        }}>Manage your employees and track performance</p>
      </div>

      {/* Action Buttons */}
      <div className="row m-0 p-2" style={{ marginBottom: '24px' }}>
        <div
          className="col"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            ...(isMobile && {
              flexDirection: 'row',
              gap: '6px',
              paddingLeft: '8px',
              paddingRight: '8px',
              marginLeft: '0',
              width: '100%'
            }),
            ...(!isMobile && {
              gap: '10px'
            })
          }}
        >
          <button 
            className="homebtn" 
            onClick={() => navigate('/store/employees/list')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              ...(isMobile ? {
                padding: '6px 8px',
                fontSize: '11px',
                borderRadius: '6px',
                flex: '0 0 calc(33.333% - 4px)',
                maxWidth: 'calc(33.333% - 4px)',
                width: 'calc(33.333% - 4px)',
                minHeight: '32px',
                boxSizing: 'border-box',
                whiteSpace: 'normal',
                margin: 0
              } : {
                padding: '12px 24px',
                fontSize: '14px',
                borderRadius: '8px',
                whiteSpace: 'nowrap'
              })
            }}
          >
            Employees List
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Flex wrap="wrap" justify="space-between" px={2} style={{ marginBottom: isMobile ? '16px' : '24px', gap: isMobile ? '10px' : '16px' }}>
        <ReusableCard title="Managers" value={stats.managers.toString()} />
        <ReusableCard title="Staff" value={stats.staff.toString()} color="blue.500" />
        <ReusableCard title="Present Today" value={stats.presentToday.toString()} color="green.500" />
        <ReusableCard title="On Leave" value={stats.onLeave.toString()} color="yellow.500" />
      </Flex>
    </div>
  );
}












