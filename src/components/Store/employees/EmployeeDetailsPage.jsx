import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/Auth";
import EmployeeTabSection from "./EmployeeTabSection";
import Loading from "@/components/Loading";
import ErrorModal from "@/components/ErrorModal";

function EmployeeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosAPI } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await axiosAPI.get(`/employees/${id}`);
      if (res.data) {
        setEmployee(res.data);
      }
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setError(err.response?.data?.message || "Failed to load employee details");
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Loading />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4">
        <p>Employee not found</p>
      </div>
    );
  }

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/store/employees")}>Employees</span>{" "}
        <i className="bi bi-chevron-right"></i> Employee Details
      </p>

      <div className="p-4">
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h4 style={{ fontFamily: 'Poppins', fontWeight: 600, marginBottom: '10px', color: 'var(--primary-color)' }}>
            {employee.name}
          </h4>
          <p style={{ fontFamily: 'Poppins', color: '#666', margin: 0 }}>
            {employee.mobile} {employee.email ? `• ${employee.email}` : ''}
          </p>
          <p style={{ fontFamily: 'Poppins', color: '#666', margin: '4px 0 0 0' }}>
            {employee.role} • {employee.department}
          </p>
        </div>

        <EmployeeTabSection employee={employee} />
      </div>

      {isModalOpen && (
        <ErrorModal
          isOpen={isModalOpen}
          message={error}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

export default EmployeeDetailsPage;

