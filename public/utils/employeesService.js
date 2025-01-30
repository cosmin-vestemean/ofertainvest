import { client } from '../client.js'
const worker = new Worker('../workers/employeesWorker.js');
let loadPromise = null;

export const employeesService = {
  async loadEmployees() {
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'error') {
          reject(new Error(e.data.error));
        } else if (e.data.type === 'employees') {
          resolve(e.data.data);
        }
      };

      worker.onerror = (error) => {
        reject(error);
      };

      worker.postMessage({ type: 'loadEmployees' });
    });

    return loadPromise;
  },

  clearCache() {
    loadPromise = null;
    worker.postMessage({ type: 'clearCache' });
  }
};
