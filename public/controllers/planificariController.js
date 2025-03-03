import { planificariDataService } from '../services/planificariDataService.js'
import { employeesService } from '../utils/employeesService.js'
import { contextOferta } from '../client.js'
import { upsertDocument } from '../utils/documentOperations.js'
import { tables } from '../utils/tables.js'

export class PlanificariController {
  constructor() {
    this.planificari = []
    this.displayData = []
  }

  /**
   * Load planificari and prepare display data
   * @param {Function} mask The mask function to apply to format display data
   * @returns {Promise<Array>} Prepared display data
   */
  async loadPlanificari(mask) {
    this.planificari = await planificariDataService.loadPlanificari()
    
    if (mask) {
      this.displayData = this.planificari.map((p) => {
        const filtered = {}
        Object.keys(mask).forEach((key) => {
          if (mask[key].usefull) {
            filtered[key] = p[key]
          }
        })
        return filtered
      })
    } else {
      this.displayData = [...this.planificari]
    }
    
    return this.displayData
  }

  /**
   * Load employees if needed
   * @returns {Promise<Array>} List of employees
   */
  async loadEmployees() {
    try {
      if (contextOferta?.angajati?.length > 0) {
        return contextOferta.angajati
      } else {
        const employees = await employeesService.loadEmployees()
        if (employees?.length > 0) {
          contextOferta.angajati = employees
        }
        return employees || []
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      return []
    }
  }

  /**
   * Get a specific planificare by ID
   * @param {number} id Planificare ID
   * @returns {Object|null} Planificare header object
   */
  getPlanificareById(id) {
    return this.planificari.find((p) => p.CCCPLANIFICARI === id) || null
  }

  /**
   * Create and setup a new planificare
   * @param {Object} headerData Header data for new planificare
   * @param {HTMLElement} tableElement Table element to update
   * @param {Object} displayConfig Display configuration
   * @returns {void}
   */
  async setupNewPlanificare(headerData, tableElement, displayConfig) {
    if (!contextOferta?.CCCOFERTEWEB) {
      throw new Error('Nu există o ofertă validă selectată')
    }

    const planificareData = planificariDataService.createNewPlanificareData()
    
    Object.assign(tableElement, {
      hasMainHeader: true,
      hasSubHeader: false,
      canAddInLine: true,
      mainMask: displayConfig.mainMask,
      subsMask: displayConfig.subsMask,
      data: planificareData,
      documentHeader: headerData,
      documentHeaderMask: displayConfig.headerMask
    })

    tables.hideAllBut([tables.tablePlanificareCurenta])
  }

  /**
   * Open an existing planificare
   * @param {number} id Planificare ID
   * @param {HTMLElement} tableElement Table element to update
   * @param {Object} displayConfig Display configuration
   * @param {boolean} hideAllBut Whether to hide other tables
   * @returns {Promise<void>}
   */
  async openPlanificare(id, tableElement, displayConfig, hideAllBut = true) {
    if (!contextOferta?.CCCOFERTEWEB) {
      throw new Error('No valid CCCOFERTEWEB found')
    }

    const header = this.getPlanificareById(id)
    if (!header) {
      throw new Error('Failed to find planificare header')
    }

    const planificareData = await planificariDataService.convertPlanificareData(header.linii || [])

    Object.assign(tableElement, {
      hasMainHeader: true,
      hasSubHeader: false,
      canAddInLine: true,
      mainMask: displayConfig.mainMask,
      subsMask: displayConfig.subsMask,
      data: planificareData,
      documentHeader: {
        responsabilPlanificare: header.RESPPLAN,
        responsabilExecutie: header.RESPEXEC,
        id: header.CCCPLANIFICARI
      },
      documentHeaderMask: displayConfig.headerMask
    })

    if (hideAllBut) tables.hideAllBut([tables.tablePlanificareCurenta])
  }

  /**
   * Save a new planificare document
   * @param {Object} documentHeader Document header data
   * @param {Array} articleItems Article items to save
   * @returns {Promise<Object>} Result of save operation
   */
  async savePlanificare(documentHeader, articleItems) {
    const idOferta = contextOferta.CCCOFERTEWEB
    
    const header = {
      CCCOFERTEWEB: idOferta,
      NAME: `Planificare ${new Date().toISOString()}`,
      DATASTART: documentHeader.startDate,
      DATASTOP: documentHeader.endDate,
      RESPPLAN: documentHeader.responsabilPlanificare,
      RESPEXEC: documentHeader.responsabilExecutie
    }

    // Build lines
    const lines = []
    
    // Process main articles and subarticles
    articleItems.forEach((item) => {
      let articol = item.articol
      // Add main article
      if (articol[_cantitate_planificari] > 0)
        lines.push({
          CCCOFERTEWEB: idOferta,
          CCCANTEMASURATORI: articol.CCCANTEMASURATORI,
          CANTITATE: articol[_cantitate_planificari]
        })

      // Add subarticles if they exist
      if (item.subarticole) {
        item.subarticole.forEach((sub) => {
          if (sub[_cantitate_planificari] > 0)
            lines.push({
              CCCOFERTEWEB: idOferta,
              CCCANTEMASURATORI: sub.CCCANTEMASURATORI,
              CANTITATE: sub[_cantitate_planificari]
            })
        })
      }
    })

    if (lines.length === 0) {
      throw new Error('Nu am gasit planificari valide')
    }

    return await upsertDocument({
      headerTable: 'CCCPLANIFICARI',
      header,
      linesTable: 'CCCPLANIFICARILINII',
      lines,
      upsert: 'insert'
    })
  }

  /**
   * Validate date inputs
   * @param {string} startDate Start date
   * @param {string} endDate End date
   * @returns {boolean} Whether dates are valid
   */
  validateDates(startDate, endDate) {
    if (!startDate || !endDate) {
      return false
    }

    if (new Date(startDate) > new Date(endDate)) {
      return false
    }

    return true
  }
}

// Create singleton instance
export const planificariController = new PlanificariController()