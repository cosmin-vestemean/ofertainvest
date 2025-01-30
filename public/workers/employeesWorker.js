import client from '../client.js';

let employeesCache = null;

self.onmessage = async function(e) {
  if (e.data.type === 'loadEmployees') {
    try {
      if (employeesCache) {
        self.postMessage({
          type: 'employees',
          data: employeesCache,
          fromCache: true
        });
        return;
      }

      const result = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT A.PRSN, A.NAME2 
                    FROM PRSN A 
                    LEFT OUTER JOIN PRSEXTRA B ON A.PRSN=B.PRSN AND A.SODTYPE=B.SODTYPE AND B.COMPANY=1 
                    WHERE A.COMPANY=:X.SYS.COMPANY AND A.SODTYPE=20 AND A.ISACTIVE=1 AND A.TPRSN=0 AND B.UTBL02=1`
        }
      });

      employeesCache = result.data;

      self.postMessage({
        type: 'employees',
        data: employeesCache,
        fromCache: false
      });

    } catch (error) {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }

  if (e.data.type === 'clearCache') {
    employeesCache = null;
  }
}
