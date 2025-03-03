import { ApiResponse } from '../../common/api.types';

const API_BASE_URL = 'http://localhost:3000/api';
// const API_BASE_URL = 'https://fullpath-energyemissions-cost-model.onrender.com/api';

export const api = {
  async startProcess(clientId: string): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${API_BASE_URL}/start-process?clientId=${clientId}`);
    const data = await response.json();
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      ok: response.ok,
      redirected: response.redirected,
      type: response.type,
      url: response.url,
      timestamp: new Date().toISOString(),
    };
  },
};