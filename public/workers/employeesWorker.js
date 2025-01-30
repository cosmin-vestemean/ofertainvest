let employeesCache = null;

self.onmessage = async function(e) {
  if (e.data.type === 'loadEmployees') {
    try {
      // If cached, return immediately
      if (employeesCache) {
        self.postMessage({
          type: 'employees',
          data: employeesCache,
          fromCache: true
        });
        return;
      }

      const response = await fetch('/api/getDataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: {
            sqlQuery: `SELECT A.PRSN, A.NAME2 
                      FROM PRSN A 
                      LEFT OUTER JOIN PRSEXTRA B ON A.PRSN=B.PRSN AND A.SODTYPE=B.SODTYPE AND B.COMPANY=1 
                      WHERE A.COMPANY=:X.SYS.COMPANY AND A.SODTYPE=20 AND A.ISACTIVE=1 AND A.TPRSN=0 AND B.UTBL02=1`
          }
        })
      });

      const result = await response.json();
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
