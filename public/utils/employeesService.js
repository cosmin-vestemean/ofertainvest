import { client } from '../client.js'

export const employeesService = {
  async loadEmployees() {
    try {
      const result = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT A.PRSN, A.NAME2 
                     FROM PRSN A 
                     LEFT OUTER JOIN PRSEXTRA B ON A.PRSN=B.PRSN AND A.SODTYPE=B.SODTYPE AND B.COMPANY=1 
                     WHERE A.COMPANY=:X.SYS.COMPANY AND A.SODTYPE=20 AND A.ISACTIVE=1 AND A.TPRSN=0 AND B.UTBL02=1`
        }
      })
      const employees = result.success ? result.data : []
      console.log('employees', employees)
      return employees
    } catch (error) {
      console.error('Error loading employees:', error)
      return []
    }
  }
}
