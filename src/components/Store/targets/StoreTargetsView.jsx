import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/Auth";
import styles from "../../Dashboard/Targets/Targets.module.css";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

function StoreTargetsView() {
  const { axiosAPI } = useAuth();
  
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  useEffect(() => {
    const fetchTargets = async () => {
        setLoading(true);
        try {
            const currentStoreId = localStorage.getItem("currentStoreId");
            if (!currentStoreId) {
                setTargets([]);
                return;
            }

            const targetsRes = await axiosAPI.get(`/stores/targets?storeId=${currentStoreId}`);
            let targetsData = targetsRes.data?.targets || targetsRes.data?.data || targetsRes.data || [];
            if (!Array.isArray(targetsData) && Array.isArray(targetsRes.data)) {
                targetsData = targetsRes.data;
            }
            setTargets(targetsData);

        } catch (error) {
            console.error("Error fetching store targets:", error);
            setError(error.response?.data?.message || "Failed to fetch targets");
            setIsErrorModalOpen(true);
            setTargets([]);
        } finally {
            setLoading(false);
        }
    };

    fetchTargets();
  }, [axiosAPI]);

  const { activeTargets, pastTargets } = useMemo(() => {
    const now = new Date();
    
    const active = [];
    const past = [];
    
    targets.forEach(t => {
      const endDateObj = t.endDate ? new Date(t.endDate) : null;
      const isExpired = t.status === 'active' && endDateObj && endDateObj < now;
      
      if (t.status === 'active' && !isExpired) {
        active.push(t);
      } else {
        // Include expired and non-active statuses in past
        past.push({ ...t, isExpired });
      }
    });

    return { activeTargets: active, pastTargets: past };
  }, [targets]);

  const renderTargetTable = (data, title, emptyMessage) => (
    <div className="mb-5">
      <div className={styles.header} style={{ borderBottom: '2px solid #eee', marginBottom: '15px', paddingBottom: '5px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>{title}</h2>
      </div>

      <div className="row m-0 justify-content-center">
        <div className="col-lg-12">
          <div className="table-responsive">
          <table className="table table-bordered borderedtable">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>S.No</th>
                <th>Target Amount</th>
                <th>Target Bags</th>
                <th>Period</th>
                <th>Progress (Amt)</th>
                <th>Progress (Bags)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr className="animated-row">
                  <td colSpan={7} className="text-center text-muted py-4">{emptyMessage}</td>
                </tr>
              )}
              {data.length > 0 &&
                data.map((target, idx) => {
                  const startDate = target.startDate ? new Date(target.startDate).toLocaleDateString('en-IN') : '-';
                  const endDate = target.endDate ? new Date(target.endDate).toLocaleDateString('en-IN') : '-';
                  
                  const progressAmt = target.progressPercentage ? Number(target.progressPercentage).toFixed(1) : "0.0";
                  const progressBags = target.bagsPercentage ? Number(target.bagsPercentage).toFixed(1) : "0.0";
                  
                  const now = new Date();
                  const endDateObj = target.endDate ? new Date(target.endDate) : null;
                  const isExpired = target.isExpired || (target.status === 'active' && endDateObj && endDateObj < now);
                  
                  const status = isExpired ? 'expired' : (target.status || 'active');
                  const statusBadgeClass = status === 'active' ? 'bg-success' : 
                                           status === 'completed' ? 'bg-primary' : 
                                           status === 'expired' ? 'bg-danger' : 'bg-secondary';

                  return (
                    <tr
                      key={target.id}
                      className="animated-row"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <td>{idx + 1}</td>
                      <td className="text-end">{target.targetAmount ? `₹${Number(target.targetAmount).toLocaleString()}` : '-'}</td>
                      <td className="text-end">{target.targetBags ? Number(target.targetBags).toLocaleString() : '-'}</td>
                      <td>{startDate} to {endDate}</td>
                      <td>
                          {target.targetAmount ? (
                              <div className="d-flex flex-column">
                                  <small>₹{Number(target.currentProgress || 0).toLocaleString()}</small>
                                  <div className="progress" style={{ height: '5px' }}>
                                      <div className="progress-bar bg-info" role="progressbar" style={{ width: `${progressAmt}%` }}></div>
                                  </div>
                                  <small className="text-muted" style={{ fontSize: '10px' }}>{progressAmt}%</small>
                              </div>
                          ) : '-'}
                      </td>
                      <td>
                          {target.targetBags ? (
                              <div className="d-flex flex-column">
                                  <small>{Number(target.currentBagsProgress || 0).toLocaleString()}</small>
                                  <div className="progress" style={{ height: '5px' }}>
                                      <div className="progress-bar bg-warning" role="progressbar" style={{ width: `${progressBags}%` }}></div>
                                  </div>
                                  <small className="text-muted" style={{ fontSize: '10px' }}>{progressBags}%</small>
                              </div>
                          ) : '-'}
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>
                          {status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
          <h1 style={{ fontWeight: '700', color: '#1a1a1a' }}>Store Targets</h1>
      </div>

      {renderTargetTable(activeTargets, "Active Targets", "NO ACTIVE TARGETS ASSIGNED")}
      
      {renderTargetTable(pastTargets, "Past Targets", "NO PAST TARGETS FOUND")}

      {isErrorModalOpen && (
        <ErrorModal isOpen={isErrorModalOpen} message={error} onClose={closeErrorModal} />
      )}

      {loading && <Loading />}
    </div>
  );
}

export default StoreTargetsView;
