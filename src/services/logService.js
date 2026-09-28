import api from "./apiService";

const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, value);
  });
  return searchParams.toString();
};

const logService = {
  async getLogs(params = {}) {
    const queryString = toQueryString(params);
    const res = await api.request(`/logs${queryString ? `?${queryString}` : ""}`, {
      method: "GET",
    });
    return res.json();
  },

  async getLogFilters() {
    const res = await api.request("/logs/filters", { method: "GET" });
    return res.json();
  },

  async getLogDetail(logId) {
    const res = await api.request(`/logs/${logId}`, { method: "GET" });
    return res.json();
  },
};

export default logService;
