import { client, contextOferta } from '../client.js'
import { _cantitate_antemasuratori, _cantitate_planificari } from '../utils/def_coloane.js'
import { convertDBAntemasuratori } from '../controllers/antemasuratori.js'

// Cache for planificari data
let cachedPlanificari = null
let lastLoadContext = null

export const planificariService = {
  async getPlanificari(forceRefresh = false) {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found')
      return { success: false, data: [] }
    }
    
    // Use cached data if available and context hasn't changed
    if (!forceRefresh && cachedPlanificari && lastLoadContext === contextOferta.CCCOFERTEWEB) {
      console.log('Using cached planificari data')
      return { success: true, data: cachedPlanificari }
    }

    console.log('Fetching fresh planificari data from database')
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

      if (!response.success || !response.data) {
        console.error('Database query failed:', response.error)
        return { success: false, data: [], error: response.error }
      }

      console.log(`Raw data received, ${response.data.length} rows`)
      
      // Process the data
      const grouped = this.processResponseData(response.data)
      console.log(`Processed into ${grouped.length} planificari`)
      
      // Cache the results
      cachedPlanificari = grouped
      lastLoadContext = contextOferta.CCCOFERTEWEB
      
      return { success: true, data: grouped }
    } catch (error) {
      console.error('Error in getPlanificari:', error)
      return { success: false, data: [], error }
    }
  },

  processResponseData(data) {
    if (!data || data.length === 0) {
      return []
    }
    
    // Group by planificare header
    const grouped = data.reduce((acc, row) => {
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
  },

  async convertPlanificareData(linii) {
    if (!linii || linii.length === 0) {
      return []
    }
    
    try {
      const result = await convertDBAntemasuratori(linii || [])
      return result
    } catch (error) {
      console.error('Error converting planificare data:', error)
      return []
    }
  },
  
  clearCache() {
    cachedPlanificari = null
    lastLoadContext = null
    console.log('Planificari cache cleared')
  }
}