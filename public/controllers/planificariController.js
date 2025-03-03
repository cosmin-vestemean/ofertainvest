import { client, contextOferta } from '../client.js'
import { planificariService } from '../services/planificariService.js'
import { ds_antemasuratori } from './antemasuratori.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

export class PlanificariController {
  constructor() {
    this.planificari = []
  }

  /**
   * Load all planificari for the current oferta
   * @returns {Promise<{success: boolean, data: Array, error: string}>}
   */
  async loadPlanificari() {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found for loading planificari')
      return { success: false, data: [], error: 'No valid CCCOFERTEWEB found' }
    }

    try {
      const result = await planificariService.getPlanificari()
      
      if (result.success) {
        this.planificari = result.data
        console.info('Loaded planificari:', this.planificari)
      }
      
      return result
    } catch (error) {
      console.error('Error loading planificari:', error)
      this.planificari = []
      return { success: false, data: [], error: error.message || 'Unknown error' }
    }
  }

  /**
   * Get details for a specific planificare by ID
   * @param {number} id - The planificare ID
   * @returns {Promise<{success: boolean, data: Object|null, error: string}>}
   */
  async getPlanificareDetails(id) {
    if (!this.planificari.length) {
      await this.loadPlanificari()
    }

    const header = this.planificari.find((p) => p.CCCPLANIFICARI === id)
    if (!header) {
      return { success: false, data: null, error: 'Failed to find planificare header' }
    }

    try {
      const planificareData = await planificariService.convertPlanificareData(header.linii)
      return { success: true, data: planificareData, header }
    } catch (error) {
      console.error('Error processing planificare details:', error)
      return { success: false, data: null, error: error.message || 'Error processing planificare details' }
    }
  }

  /**
   * Prepare a new planificare based on antemasuratori
   * @returns {Array} Prepared planificare data
   */
  preparePlanificareNoua() {
    if (!ds_antemasuratori?.length) {
      console.warn('No antemasuratori available for new planificare')
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
   * Validate a planificare date range
   * @param {string} startDate 
   * @param {string} endDate 
   * @returns {{valid: boolean, message: string}}
   */
  validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      return { valid: false, message: 'Please select both start and end dates' }
    }

    if (new Date(startDate) > new Date(endDate)) {
      return { valid: false, message: 'Start date cannot be after end date' }
    }

    return { valid: true, message: '' }
  }
}

export const planificariController = new PlanificariController()