import { client, contextOferta } from '../client.js'
import { convertDBAntemasuratori } from './antemasuratori.js'
import { _cantitate_antemasuratori, _cantitate_planificari } from '../utils/def_coloane.js'

class PlanificariController {
  constructor() {
    this.planificari = []
    this.displayData = []
    this.eventTarget = new EventTarget()
  }

  // Event handling
  addEventListener(type, listener) {
    this.eventTarget.addEventListener(type, listener)
  }

  removeEventListener(type, listener) {
    this.eventTarget.removeEventListener(type, listener)
  }

  // State management
  getPlanificari() {
    return this.planificari
  }

  getDisplayData() {
    return this.displayData
  }

  dispatchDataUpdate() {
    const event = new CustomEvent('planificariUpdate', {
      detail: {
        planificari: this.planificari,
        displayData: this.displayData
      }
    })
    this.eventTarget.dispatchEvent(event)
  }

  async loadPlanificari() {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found')
      return { planificari: [], displayData: [] }
    }

    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT p.CCCPLANIFICARI, p.CCCOFERTEWEB, 
            p.RESPEXEC, p.RESPPLAN,
            u1.NAME2 as RESPPLAN_NAME, 
            u2.NAME2 as RESPEXEC_NAME,
            l.*, a.*, o.*, c.*, 
            l.CANTITATE as ${_cantitate_planificari}, 
            a.CANTITATE as ${_cantitate_antemasuratori}
            FROM CCCPLANIFICARI p
            LEFT JOIN PRSN u1 ON u1.PRSN = p.RESPPLAN
            LEFT JOIN PRSN u2 ON u2.PRSN = p.RESPEXEC 
            inner join cccplanificarilinii l on (p.CCCPLANIFICARI = l.CCCPLANIFICARI)
            inner join cccantemasuratori a on (l.CCCANTEMASURATORI = a.CCCANTEMASURATORI 
              and l.CCCOFERTEWEB = a.CCCOFERTEWEB)
            inner join cccoferteweblinii o on (a.CCCOFERTEWEBLINII = o.CCCOFERTEWEBLINII)
            inner join cccpaths c on (c.CCCPATHS = a.CCCPATHS)
            WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
            ORDER BY p.RESPPLAN, p.RESPEXEC`
        }
      })

      console.info('Loaded planificari:', response)

      if (!response?.success || !response?.data) {
        throw new Error('Failed to load planificari')
      }

      const grouped = this.groupPlanificariData(response.data)
      console.info('Grouped planificari:', grouped)
      const planificari = await this.processPlanificari(grouped)
      console.info('Processed planificari:', planificari)
      const displayData = this.prepareDisplayData(planificari)
      console.info('Display data:', displayData)

      // Update internal state
      this.planificari = planificari
      this.displayData = displayData

      // Notify listeners
      this.dispatchDataUpdate()

      return { planificari, displayData }
    } catch (error) {
      console.error('Error loading planificari:', error)
      throw error
    }
  }

  groupPlanificariData(data) {
    return data.reduce((acc, row) => {
      if (!acc[row.CCCPLANIFICARI]) {
        acc[row.CCCPLANIFICARI] = {
          CCCPLANIFICARI: row.CCCPLANIFICARI,
          CCCOFERTEWEB: row.CCCOFERTEWEB,
          RESPEXEC: row.RESPEXEC,
          RESPPLAN: row.RESPPLAN,
          RESPPLAN_NAME: row.RESPPLAN_NAME,
          RESPEXEC_NAME: row.RESPEXEC_NAME,
          linii: []
        }
      }
      if (row.CCCANTEMASURATORI) {
        acc[row.CCCPLANIFICARI].linii.push(row)
      }
      return acc
    }, {})
  }

  async processPlanificari(grouped) {
    const planificari = Object.values(grouped)
    for (const planificare of planificari) {
      planificare.processedLinii = await convertDBAntemasuratori(planificare.linii || [])
    }
    return planificari
  }

  prepareDisplayData(planificari) {
    return planificari.map(p => ({
      CCCPLANIFICARI: p.CCCPLANIFICARI,
      CCCOFERTEWEB: p.CCCOFERTEWEB,
      RESPEXEC: p.RESPEXEC,
      RESPPLAN: p.RESPPLAN,
      RESPPLAN_NAME: p.RESPPLAN_NAME,
      RESPEXEC_NAME: p.RESPEXEC_NAME
    }))
  }

  async getPlanificareById(id, planificari) {
    const planificare = planificari.find(p => p.CCCPLANIFICARI === id)
    if (!planificare) {
      throw new Error(`Planificare with id ${id} not found`)
    }
    return planificare
  }
}

export const planificariController = new PlanificariController()
