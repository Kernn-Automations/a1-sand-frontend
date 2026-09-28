import axiosInstance from './apiService';

/**
 * Store Target Service - Handles specific store target operations
 */
class StoreTargetService {

    /**
     * Create a target for a specific store
     * POST /stores/:storeId/targets
     * @param {number|string} storeId 
     * @param {Object} data - { targetAmount, targetBags, startDate, endDate }
     */
    async createStoreTarget(storeId, data) {
        try {
            const response = await axiosInstance.post(`/stores/${storeId}/targets`, data);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw { response: { data: errorData, status: response.status } };
            }
            return await response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get all store targets
     * GET /stores/targets
     * @param {Object} params - Query params like { storeId, status, etc. }
     */
    async getStoreTargets(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const url = `/stores/targets${query ? `?${query}` : ''}`;
            const response = await axiosInstance.get(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw { response: { data: errorData, status: response.status } };
            }
            return await response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Get a single target for a specific store
     * GET /stores/:storeId/targets/:targetId
     * @param {number|string} storeId
     * @param {number|string} targetId
     */
    async getStoreTargetById(storeId, targetId) {
        try {
            const response = await axiosInstance.get(`/stores/${storeId}/targets/${targetId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw { response: { data: errorData, status: response.status } };
            }
            return await response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Update a target for a specific store
     * PUT /stores/:storeId/targets/:targetId
     * @param {number|string} storeId
     * @param {number|string} targetId
     * @param {Object} data - { targetAmount, targetBags, endDate }
     */
    async updateStoreTarget(storeId, targetId, data) {
        try {
            const response = await axiosInstance.put(`/stores/${storeId}/targets/${targetId}`, data);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw { response: { data: errorData, status: response.status } };
            }
            return await response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Cancel (soft delete) a target for a specific store
     * PATCH /stores/:storeId/targets/:targetId/cancel
     * @param {number|string} storeId
     * @param {number|string} targetId
     */
    async cancelStoreTarget(storeId, targetId) {
        try {
            const response = await axiosInstance.patch(`/stores/${storeId}/targets/${targetId}/cancel`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw { response: { data: errorData, status: response.status } };
            }
            return await response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Bulk assign targets to multiple stores
     * POST /stores/targets/bulk-assign
     * @param {Object} data - { storeIds: [], targetAmount, targetBags, startDate, endDate }
     */
    async bulkAssignStoreTargets(data) {
        try {
            const response = await axiosInstance.post('/stores/targets/bulk-assign', data);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw { response: { data: errorData, status: response.status } };
            }
            return await response.json();
        } catch (error) {
            throw this.handleError(error);
        }
    }

    handleError(error) {
        if (error.response) {
            const message = error.response.data?.message || 'An error occurred';
            const status = error.response.status;
            return new Error(`${status}: ${message}`);
        } else if (error.request) {
            return new Error('Network error: No response from server');
        } else {
            return new Error(`Request error: ${error.message}`);
        }
    }
}

export default new StoreTargetService();
