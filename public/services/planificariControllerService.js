import { contextOferta } from '../client.js'
import { employeesService } from '../utils/employeesService.js'
import { planificariService } from '../services/planificariService.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

/**
 * Service that handles the business logic for planificari management.
 * Implemented as a singleton to allow consistent state across components.
 */
class PlanificariControllerService {
  constructor() {
    this._angajati = []
    this._planificari = []
    this._processedPlanificari = {}
    this._isInitialized = false
    this._eventListeners = {}
  }

  /**
   * Initialize the controller if not already done
   */
  async init() {
    if (this._isInitialized) return
    
    try {
      await this.loadEmployees()
      await this.loadPlanificari()
      this._isInitialized = true
    } catch (error) {
      console.error('Failed to initialize PlanificariControllerService:', error)
      this._triggerEvent('error', { message: 'Failed to initialize controller', error })
    }
  }

  /**
   * Loads employee data from context or service
   */
  async loadEmployees() {
    try {
      // First check context
      if (contextOferta?.angajati?.length > 0) {
        this._angajati = contextOferta.angajati
      } else {
        // If not in context, load and cache
        const employees = await employeesService.loadEmployees()
        if (employees?.length > 0) {
          this._angajati = employees
          // Cache for other components
          contextOferta.angajati = employees
        }
      }
      this._triggerEvent('employeesLoaded', { data: this._angajati })
      return this._angajati
    } catch (error) {
      console.error('Failed to load employees:', error)
      this._angajati = []
      this._triggerEvent('error', { message: 'Failed to load employees', error })
      return []
    }
  }
  
  /**
   * Get current list of employees
   */
  get angajati() {
    return this._angajati
  }
  
  /**
   * Get current list of planificari
   */
  get planificari() {
    return this._planificari
  }
  
  /**
   * Get processed planificari data
   */
  get processedPlanificari() {
    return this._processedPlanificari
  }
  
  /**
   * Loads planificari data with option to force refresh from database
   */
  async loadPlanificari(forceRefresh = false) {
    if (!contextOferta?.CCCOFERTEWEB) {
      const error = { message: 'Nu există o ofertă validă selectată' }
      this._triggerEvent('error', error)
      return { success: false, error: error.message }
    }
  
    try {
      this._triggerEvent('loadingStarted')
      
      // Pass the forceRefresh parameter to the service
      const result = await planificariService.getPlanificari(forceRefresh)
  
      if (!result.success) {
        const error = { message: 'Eroare la încărcarea planificărilor' }
        this._triggerEvent('error', error)
        return { success: false, error: error.message }
      }
  
      // Store the raw data
      this._planificari = result.data
      
      // Pre-process all planificare details
      await this.preprocessAllPlanificariDetails()
  
      const message = forceRefresh 
        ? 'Planificările au fost reîncărcate din baza de date' 
        : 'Planificările au fost încărcate cu succes'
        
      this._triggerEvent('planificariLoaded', { 
        data: this._planificari, 
        processedData: this._processedPlanificari,
        message
      })
      
      return { success: true, data: this._planificari, message }
    } catch (error) {
      console.error('Error in loadPlanificari:', error)
      this._planificari = []
      this._processedPlanificari = {}
      this._triggerEvent('error', { message: error.message, error })
      return { success: false, error: error.message }
    } finally {
      this._triggerEvent('loadingFinished')
    }
  }

  /**
   * Pre-processes all planificari data to prepare for display
   */
  async preprocessAllPlanificariDetails() {
    try {
      // Process all planificari data in parallel
      const processingPromises = this._planificari.map(async (header) => {
        try {
          const convertedData = await planificariService.convertPlanificareData(header.linii)
          this._processedPlanificari[header.CCCPLANIFICARI] = convertedData
        } catch (error) {
          console.error(`Error pre-processing planificare ${header.CCCPLANIFICARI}:`, error)
          this._processedPlanificari[header.CCCPLANIFICARI] = []
        }
      })

      // Wait for all processing to complete
      await Promise.all(processingPromises)
      this._triggerEvent('dataProcessed', { data: this._processedPlanificari })
    } catch (error) {
      this._triggerEvent('error', { message: 'Eroare la procesarea datelor', error })
      throw error
    }
  }

  /**
   * Gets details for a specific planificare by ID
   */
  getPlanificareById(id) {
    const header = this._planificari.find((p) => p.CCCPLANIFICARI === id)
    if (!header) {
      return null
    }
    
    return {
      header,
      data: this._processedPlanificari[id] || []
    }
  }
  
  /**
   * Creates a new planificare with initial state
   */
  createNewPlanificare({ responsabilPlanificare, responsabilExecutie }) {
    if (!ds_antemasuratori?.length) {
      throw new Error('Nu există antemăsurători disponibile')
    }

    if (!contextOferta?.CCCOFERTEWEB) {
      throw new Error('Nu există o ofertă validă selectată')
    }

    // Create a deep copy of antemasuratori
    let ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
    
    // Initialize quantities to 0
    ds_planificareNoua.forEach((parent) => {
      parent.content.forEach((item) => {
        item.object[_cantitate_planificari] = 0
        item.children?.forEach((child) => {
          child.object[_cantitate_planificari] = 0
        })
      })
    })

    const newPlanificare = {
      data: ds_planificareNoua,
      header: {
        responsabilPlanificare,
        responsabilExecutie
      }
    }
    
    this._triggerEvent('planificareCreated', { planificare: newPlanificare })
    return newPlanificare
  }

  /**
   * Gets planificari filtered by responsabili
   */
  getPlanificariByResponsabili({ RESPPLAN, RESPEXEC } = {}) {
    if (!this._planificari?.length) {
      return []
    }

    return this._planificari.filter((planificare) => {
      return (
        (!RESPPLAN || planificare.RESPPLAN === RESPPLAN) && 
        (!RESPEXEC || planificare.RESPEXEC === RESPEXEC)
      )
    })
  }
  
  /**
   * Validates date range
   */
  validateDates(startDate, endDate) {
    if (!startDate || !endDate) {
      return true // No dates provided is valid
    }
    
    return new Date(startDate) <= new Date(endDate)
  }
  
  /**
   * Register an event listener
   * @param {string} eventName - Event name to listen for
   * @param {function} callback - Function to call when event is triggered
   */
  addEventListener(eventName, callback) {
    if (!this._eventListeners[eventName]) {
      this._eventListeners[eventName] = []
    }
    
    this._eventListeners[eventName].push(callback)
  }
  
  /**
   * Remove an event listener
   * @param {string} eventName - Event name
   * @param {function} callback - Callback function to remove
   */
  removeEventListener(eventName, callback) {
    if (!this._eventListeners[eventName]) return
    
    this._eventListeners[eventName] = this._eventListeners[eventName]
      .filter(cb => cb !== callback)
  }
  
  /**
   * Trigger an event with data
   * @param {string} eventName - Name of the event
   * @param {Object} data - Data to pass to listeners
   * @private
   */
  _triggerEvent(eventName, data = {}) {
    if (!this._eventListeners[eventName]) return
    
    this._eventListeners[eventName].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error)
      }
    })
  }
}

// Create singleton instance
export const planificariController = new PlanificariControllerService()

// Export the class for testing purposes
export { PlanificariControllerService }