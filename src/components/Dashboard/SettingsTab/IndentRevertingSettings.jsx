import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Settings.module.css";
import settingsService from "../../../services/settingsService";
import Loading from "../../Loading";
import ErrorModal from "../../ErrorModal";
import { isSuperAdmin, getUserFromStorage } from "../../../utils/roleUtils";

const IndentRevertingSettings = ({ navigate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [whatsappWebhook, setWhatsappWebhook] = useState({
    verifyToken: "",
    callbackUrl: "",
    lastGeneratedAt: "",
  });
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const user = getUserFromStorage();
  const showWhatsappWebhookTools = isSuperAdmin(user);
  
  const [settings, setSettings] = useState({
    audit_lock_day: 0,
    invoice_edit_window_hours: 24,
    store_invoice_edit_window_hours: 24,
    admin_invoice_edit_window_days: 30,
    store_transfer_edit_window_hours: 24,
    admin_transfer_edit_window_days: 30,
    store_customer_credit_limit: 10000,
    customer_credit_base_limit: 10000,
    company_customer_credit_pool_limit: 500000,
    customer_credit_usage_enabled: false,
    customer_credit_growth_purchase_step: 25000,
    customer_credit_growth_increment: 1000,
    customer_credit_inactive_days: 45,
    customer_credit_inactivity_penalty: 1000,
      role_revert_periods: {
      store_manager: 0,
      division_head: 0,
      zbm: 0,
      rbm: 0,
      abm: 0,
      admin: 0,
    }
  });

  useEffect(() => {
    fetchSettings();
    if (showWhatsappWebhookTools) {
      fetchWhatsappWebhookSettings();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      // Parse nested structure: data.setting.value
      const settingsData = data.setting?.value || data;
      
      // Filter out super_admin from role_revert_periods if present
      const rolePeriods = settingsData.role_revert_periods || {};
      const filteredRolePeriods = Object.keys(rolePeriods)
        .filter(key => key !== 'super_admin')
        .reduce((obj, key) => {
          obj[key] = rolePeriods[key];
          return obj;
        }, {});

      setSettings(prev => ({
        ...prev,
        ...settingsData,
        role_revert_periods: {
          ...prev.role_revert_periods, // Keep defaults
          ...filteredRolePeriods
        }
      }));
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError(err.message || "Failed to fetch settings");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchWhatsappWebhookSettings = async () => {
    try {
      setWhatsappLoading(true);
      const response = await settingsService.getWhatsappWebhookSettings();
      const webhookData = response?.data || {};
      setWhatsappWebhook({
        verifyToken: webhookData.verifyToken || "",
        callbackUrl: webhookData.callbackUrl || "",
        lastGeneratedAt: webhookData.lastGeneratedAt || "",
      });
    } catch (err) {
      console.error("Error fetching WhatsApp webhook settings:", err);
      setError(
        err.message || "Failed to fetch WhatsApp webhook configuration",
      );
      setIsErrorModalOpen(true);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleAuditLockDayChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setSettings(prev => ({
      ...prev,
      audit_lock_day: value
    }));
  };

  const handleRoleRevertPeriodChange = (role, value) => {
    const period = parseInt(value) || 0;
    setSettings(prev => ({
      ...prev,
      role_revert_periods: {
        ...prev.role_revert_periods,
        [role]: period
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");
      
      await settingsService.updateSettings(settings);
      
      setSuccessMessage("Settings updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      // Refresh to ensure we have latest data
      fetchSettings();
    } catch (err) {
      console.error("Error updating settings:", err);
      setError(err.message || "Failed to update settings");
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWhatsappToken = async () => {
    try {
      setWhatsappLoading(true);
      setError(null);
      setSuccessMessage("");
      const response = await settingsService.generateWhatsappVerifyToken();
      const webhookData = response?.data || {};
      setWhatsappWebhook({
        verifyToken: webhookData.verifyToken || "",
        callbackUrl: webhookData.callbackUrl || "",
        lastGeneratedAt: webhookData.lastGeneratedAt || "",
      });
      setSuccessMessage(
        response?.message || "WhatsApp verify token generated successfully!",
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error generating WhatsApp verify token:", err);
      setError(err.message || "Failed to generate WhatsApp verify token");
      setIsErrorModalOpen(true);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleCopyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setSuccessMessage(`${label} copied successfully!`);
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (error) {
      setError(`Failed to copy ${label.toLowerCase()}`);
      setIsErrorModalOpen(true);
    }
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
    setError(null);
  };

  if (loading && !settings.audit_lock_day && !Object.keys(settings.role_revert_periods).some(k => settings.role_revert_periods[k])) {
    return <Loading />;
  }

  return (
    <div className="container-fluid p-0">
      <div className="row m-0">
        <div className="col-12 p-3">
          <div className="d-flex align-items-center mb-4">
            <button 
              className="btn btn-secondary me-3" 
              onClick={() => navigate("/settings")}
            >
              <i className="bi bi-arrow-left"></i> Back
            </button>
            <h2 className="m-0">Indent Reverting Settings</h2>
          </div>

          {successMessage && (
            <div className="alert alert-success" role="alert">
              {successMessage}
            </div>
          )}

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">General Settings</h5>
            </div>
            <div className="card-body">
              <div className="form-group mb-3">
                <label className="form-label fw-bold">Audit Lock Day (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.audit_lock_day}
                  onChange={handleAuditLockDayChange}
                  min="0"
                />
                <small className="text-muted">Number of days before audit locks</small>
              </div>
              <div className="form-group mb-3">
                <label className="form-label fw-bold">Invoice Edit Window (Hours)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.invoice_edit_window_hours}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    invoice_edit_window_hours: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="720"
                />
                <small className="text-muted">
                  Legacy fallback window. The role-based store and admin windows below are now used for invoice edits.
                </small>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Store Sale Edit Window (Hours)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.store_invoice_edit_window_hours}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        store_invoice_edit_window_hours: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="720"
                    />
                    <small className="text-muted">
                      Applies to Store Manager and Store Employee invoice edits.
                    </small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Admin Sale Edit Window (Days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.admin_invoice_edit_window_days}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        admin_invoice_edit_window_days: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="365"
                    />
                    <small className="text-muted">
                      Applies to Admin, Division Head, and Super Admin invoice edits.
                    </small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Store Transfer Edit Window (Hours)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.store_transfer_edit_window_hours}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        store_transfer_edit_window_hours: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="720"
                    />
                    <small className="text-muted">
                      Applies to Store Manager and Store Employee transfer modifications.
                    </small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Admin Transfer Edit Window (Days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.admin_transfer_edit_window_days}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        admin_transfer_edit_window_days: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="365"
                    />
                    <small className="text-muted">
                      Applies to Admin, Division Head, and Super Admin transfer modifications.
                    </small>
                  </div>
                </div>
              </div>
              <div className="form-group mb-3">
                <label className="form-label fw-bold">Store Customer Credit Limit (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.store_customer_credit_limit}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    store_customer_credit_limit: parseInt(e.target.value) || 0
                  }))}
                  min="0"
                  max="10000000"
                />
                <small className="text-muted">
                  Maximum outstanding customer credit allowed from edited store invoices.
                </small>
              </div>
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="customerCreditUsageEnabled"
                  checked={Boolean(settings.customer_credit_usage_enabled)}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    customer_credit_usage_enabled: e.target.checked
                  }))}
                />
                <label className="form-check-label fw-bold" htmlFor="customerCreditUsageEnabled">
                  Allow Customer Credit In Store Sales
                </label>
                <div className="text-muted small">
                  When enabled, checkout can use customer credit instead of cash or bank payment for identified customers.
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Base Customer Credit Limit (INR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.customer_credit_base_limit}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        customer_credit_base_limit: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="10000000"
                    />
                    <small className="text-muted">
                      Starting per-customer limit before purchase growth, inactivity penalty, and manual overrides.
                    </small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Company Credit Pool Limit (INR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.company_customer_credit_pool_limit}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        company_customer_credit_pool_limit: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="100000000"
                    />
                    <small className="text-muted">
                      Combined company-wide credit pool shared across all customers and all stores.
                    </small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Purchase Step For Credit Growth (INR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.customer_credit_growth_purchase_step}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        customer_credit_growth_purchase_step: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      max="10000000"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Credit Growth Increment (INR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.customer_credit_growth_increment}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        customer_credit_growth_increment: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="1000000"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Inactive Customer Days</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.customer_credit_inactive_days}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        customer_credit_inactive_days: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      max="3650"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group mb-3">
                    <label className="form-label fw-bold">Inactivity Penalty (INR)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.customer_credit_inactivity_penalty}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        customer_credit_inactivity_penalty: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="1000000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Role Revert Periods (Hours)</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {Object.keys(settings.role_revert_periods).map(role => (
                  <div className="col-md-6 mb-3" key={role}>
                    <div className="form-group">
                      <label className="form-label fw-bold text-capitalize">
                        {role.replace(/_/g, " ")}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={settings.role_revert_periods[role]}
                        onChange={(e) => handleRoleRevertPeriodChange(role, e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showWhatsappWebhookTools && (
            <div className="card shadow-sm mt-4">
              <div className="card-header bg-white">
                <h5 className="mb-0">WhatsApp Webhook Tools</h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">
                  Use this callback URL and verify token in Meta Webhooks for
                  WhatsApp message status updates. This section is visible only
                  to Super Admin.
                </p>
                <div className="mb-3">
                  <label className="form-label fw-bold">Callback URL</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={whatsappWebhook.callbackUrl}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        handleCopyValue(
                          whatsappWebhook.callbackUrl,
                          "Callback URL",
                        )
                      }
                      disabled={!whatsappWebhook.callbackUrl}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Verify Token</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={whatsappWebhook.verifyToken}
                      readOnly
                      placeholder="Generate token to use in Meta webhook verification"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        handleCopyValue(
                          whatsappWebhook.verifyToken,
                          "Verify Token",
                        )
                      }
                      disabled={!whatsappWebhook.verifyToken}
                    >
                      Copy
                    </button>
                  </div>
                  <small className="text-muted">
                    {whatsappWebhook.lastGeneratedAt
                      ? `Last generated at ${new Date(
                          whatsappWebhook.lastGeneratedAt,
                        ).toLocaleString("en-IN")}`
                      : "No verify token generated yet."}
                  </small>
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={handleGenerateWhatsappToken}
                    disabled={whatsappLoading}
                  >
                    {whatsappLoading
                      ? "Generating..."
                      : "Generate Verify Token"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-end mt-4 mb-5">
            <button 
              className="btn btn-primary px-4 py-2"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      
      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={closeErrorModal}
        errorMessage={error}
      />
    </div>
  );
};

export default IndentRevertingSettings;
