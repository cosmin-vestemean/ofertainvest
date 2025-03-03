import { client, contextOferta } from '../client.js'
import { _cantitate_antemasuratori, _cantitate_planificari } from '../utils/def_coloane.js'
import { convertDBAntemasuratori } from '../controllers/antemasuratori.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'

export class PlanificariDataService {
  /**
   * Load planificari data from database
   * @returns {Promise<Array>} Array of planificari
   */
  async loadPlanificari() {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found')
      return []
    }

    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT p.CCCPLANIFICARI, p.CCCOFERTEWEB, 
            p.RESPEXEC, p.RESPPLAN,
            u1.NAME2 as RESPPLAN_NAME, 
            u2.NAME2 as RESPEXEC_NAME,
            l.*, a.*, o.*, c.*, 
            l.CANTITATE as ${_cantitate_planificari}, a.CANTITATE as ${_cantitate_antemasuratori},
            CONVERT(varchar, l.DATASTART, 103) as DATASTART_X, CONVERT(varchar, l.DATASTOP, 103) as DATASTOP_X
            FROM CCCPLANIFICARI p
            LEFT JOIN PRSN u1 ON u1.PRSN = p.RESPPLAN
            LEFT JOIN PRSN u2 ON u2.PRSN = p.RESPEXEC 
            inner join cccplanificarilinii l on (p.CCCPLANIFICARI = l.CCCPLANIFICARI)
            inner join cccantemasuratori a on (l.CCCANTEMASURATORI = a.CCCANTEMASURATORI and l.CCCOFERTEWEB = a.CCCOFERTEWEB)
            inner join cccoferteweblinii o on (a.CCCOFERTEWEBLINII = o.CCCOFERTEWEBLINII)
            inner join cccpaths c on (c.CCCPATHS = a.CCCPATHS)
            WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
            ORDER BY p.RESPPLAN, p.RESPEXEC`
        }
      })

      if (!response.success) {
        console.error('Failed to load planificari', response.error)
        return []
      }

      // Group by planificare header
      const grouped = response.data.reduce((acc, row) => {
        if (!acc[row.CCCPLANIFICARI]) {
          // Create header entry if it doesn't exist
          acc[row.CCCPLANIFICARI] = {
            CCCPLANIFICARI: row.CCCPLANIFICARI,
            CCCOFERTEWEB: row.CCCOFERTEWEB,
            RESPEXEC: row.RESPEXEC,
            RESPPLAN: row.RESPPLAN,
            RESPPLAN_NAME: row.RESPPLAN_NAME,
            RESPEXEC_NAME: row.RESPEXEC_NAME,
            linii: [] // Store detail rows here
          }
        }

        // Add detail row if it exists
        if (row.CCCANTEMASURATORI) {
          acc[row.CCCPLANIFICARI].linii.push({ ...row })
        }

        return acc
      }, {})

      // Convert to array
      return Object.values(grouped)
    } catch (error) {
      console.error('Error loading planificari:', error)
      return []
    }
  }

  /**
   * Create a new planificare dataset from antemasuratori
   * @returns {Array} New planificare dataset
   */
  createNewPlanificareData() {
    if (!ds_antemasuratori?.length) {
      console.warn('No antemasuratori available')
      return []
    }

    const planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
    planificareNoua.forEach((parent) => {
      parent.content.forEach((item) => {
        item.object[_cantitate_planificari] = 0
        item.children?.forEach((child) => {
          child.object[_cantitate_planificari] = 0
        })
      })
    })
    
    return planificareNoua
  }

  /**
   * Convert planificare details from DB format to component format
   * @param {Array} linii The lines to convert
   * @returns {Promise<Array>} Converted data
   */
  async convertPlanificareData(linii) {
    try {
      return await convertDBAntemasuratori(linii || [])
    } catch (error) {
      console.error('Error converting planificare data:', error)
      return []
    }
  }
}

// Create singleton instance
export const planificariDataService = new PlanificariDataService()