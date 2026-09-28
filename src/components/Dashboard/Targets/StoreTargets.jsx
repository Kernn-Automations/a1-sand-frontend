import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import styles from "./Targets.module.css";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";
import CreateStoreTargetModal from "./CreateStoreTargetModal";

function StoreTargets({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  
  const [targets, setTargets] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [trigger, setTrigger] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTarget(null);
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  const changeTrigger = () => setTrigger(!trigger);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const storesRes = await axiosAPI.get("/stores/abstract");
            const storesData = storesRes.data?.data || storesRes.data || [];
            setStores(Array.isArray(storesData) ? storesData : []);

            const targetsRes = await axiosAPI.get("/stores/targets");
            let targetsData = targetsRes.data?.targets || targetsRes.data?.data || targetsRes.data || [];
            if (!Array.isArray(targetsData) && Array.isArray(targetsRes.data)) {
                targetsData = targetsRes.data;
            }
            setTargets(targetsData);

        } catch (error) {
            console.error("Error fetching data:", error);
            setTargets([]);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [trigger, axiosAPI]);

  // Map store ID to Name
  const storeMap = useMemo(() => {
      const map = {};
      stores.forEach(s => {
          map[s.id] = s.storeName;
      });
      return map;
  }, [stores]);

  const handleSave = async (payload, isUpdate, isBulk) => {
      try {
          if (isUpdate) {
               if (!payload.storeId) throw new Error("Store ID missing for update");
               await axiosAPI.put(`/stores/${payload.storeId}/targets/${payload.id}`, payload);
          } else if (isBulk) {
               await axiosAPI.post('/stores/targets/bulk-assign', payload);
          } else {
               await axiosAPI.post(`/stores/${payload.storeId}/targets`, payload);
          }
          changeTrigger();
      } catch (err) {
          throw new Error(err.response?.data?.message || err.message || "Operation failed");
      }
  };

  const handleDelete = async (target) => {
      if (!window.confirm("Are you sure you want to cancel this target?")) return;
      try {
          await axiosAPI.patch(`/stores/${target.storeId}/targets/${target.id}/cancel`);
          changeTrigger();
      } catch (err) {
          setError(err.response?.data?.message || "Failed to cancel target");
          setIsErrorModalOpen(true);
      }
  };

  const handleEdit = (target) => {
      setSelectedTarget(target);
      setIsModalOpen(true);
  };

  const handleCreate = () => {
      setSelectedTarget(null);
      setIsModalOpen(true);
  };

  let index = 1;

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/targets")}>Targets</span>{" "}
        <i className="bi bi-chevron-right"></i> Store Targets
      </p>

      {/* Header and Create Button */}
      <div className={styles.header} style={{ justifyContent: 'space-between', padding: '0 20px' }}>
          <h1>Store Targets</h1>
          {isAdmin && (
             <button className="homebtn" onClick={handleCreate}>
                 Create Store Target
             </button>
          )}
      </div>

      {targets && (
        <div className="row m-0 p-3 justify-content-center">
          <div className="col-lg-12">
            <div className="table-responsive">
            <table className="table table-bordered borderedtable">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Store Name</th>
                  <th>Target Amount</th>
                  <th>Target Bags</th>
                  <th>Period</th>
                  <th>Progress (Amt)</th>
                  <th>Progress (Bags)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 && (
                  <tr className="animated-row">
                    <td colSpan={9} className="text-center">NO DATA FOUND</td>
                  </tr>
                )}
                {targets.length > 0 &&
                  targets.map((target, idx) => {
                    // Use store name from target object if available, else fallback to map or ID
                    const storeName = target.store?.name || storeMap[target.storeId] || `Store #${target.storeId}`;
                    const startDate = target.startDate ? new Date(target.startDate).toLocaleDateString('en-IN') : '-';
                    const endDate = target.endDate ? new Date(target.endDate).toLocaleDateString('en-IN') : '-';
                    
                    const progressAmt = target.progressPercentage ? Number(target.progressPercentage).toFixed(1) : "0.0";
                    // Backend returns 'bagsPercentage', not 'bagsProgressPercentage'
                    const progressBags = target.bagsPercentage ? Number(target.bagsPercentage).toFixed(1) : "0.0";
                    
                    const now = new Date();
                    const endDateObj = target.endDate ? new Date(target.endDate) : null;
                    const isExpired = target.status === 'active' && endDateObj && endDateObj < now;
                    
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
                        <td>{index++}</td>
                        <td className="fw-medium">{storeName}</td>
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
                        <td className={styles.delcol}>
                          {status === 'active' && (
                              <>
                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(target)}>
                                    <FaEdit />
                                </button>
                                {isAdmin && (
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(target)} title="Cancel Target">
                                    <FaTimes />
                                    </button>
                                )}
                              </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {isErrorModalOpen && (
        <ErrorModal isOpen={isErrorModalOpen} message={error} onClose={closeErrorModal} />
      )}

      {loading && <Loading />}

      <CreateStoreTargetModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        stores={stores}
        initialData={selectedTarget}
      />
    </>
  );
}

export default StoreTargets;
