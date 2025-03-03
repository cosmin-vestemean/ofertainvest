import { planificariService } from '../services/planificariService.js'
import { employeesService } from '../utils/employeesService.js'

class ListaPlanificariController {
  constructor() {
    this._component = null
    this._cache = {
      planificari: null,
      processedPlanificari: {},
      employees: null
    }
  }

  init(component) {
    this._component = component
    return this
  }

  async loadInitialData() {
    this._component.isLoading = true
    try {
      await Promise.all([
        this.loadEmployees(),
        this.loadPlanificari()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      this._component.isLoading = false
    }
  }

  async loadEmployees(forceReload = false) {
    if (!forceReload && this._cache.employees) {
      this._component.angajati = this._cache.employees
      return
    }

    try {
      const employees = await employeesService.loadEmployees()
      if (employees?.length > 0) {
        this._cache.employees = employees
        this._component.angajati = employees
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      this._component.angajati = []
    }
  }

  async loadPlanificari(forceReload = false) {
    this._component.isLoading = true
    
    try {
      if (!forceReload && this._cache.planificari) {
        await this._updateComponentData()
        return
      }

      const result = await planificariService.getPlanificari()
      if (!result.success) {
        throw new Error(result.error || 'Failed to load planificari')
      }

      // Cache the raw data
      this._cache.planificari = result.data
      
      // Process data before updating component
      await this._processPlanificariData()
      
      // Debug logs
      console.log('Processed data:', {
        planificari: this._cache.planificari,
        processedData: this._cache.processedPlanificari
      })

      // Wait for component update to complete
      await this._updateComponentData()
      
    } catch (error) {
      console.error('Error loading planificari:', error)
      await this._resetComponentData()
    } finally {
      this._component.isLoading = false
    }
  }

  async reload() {
    this._component.isLoading = true
    try {
      await this.loadPlanificari(true)
    } finally {
      this._component.isLoading = false
    }
  }

  async _processPlanificariData() {
    if (!this._cache.planificari) return

    this._cache.processedPlanificari = {}
    
    // Process all planificari data in parallel
    const processingPromises = this._cache.planificari.map(async header => {
      try {
        const convertedData = await planificariService.convertPlanificareData(header.linii)
        if (convertedData && convertedData.length > 0) {
          this._cache.processedPlanificari[header.CCCPLANIFICARI] = convertedData
        }
      } catch (error) {
        console.error(`Error pre-processing planificare ${header.CCCPLANIFICARI}:`, error)
        this._cache.processedPlanificari[header.CCCPLANIFICARI] = []
      }
    })

    await Promise.all(processingPromises)
  }

  async _updateComponentData() {
    if (!this._component) return
    
    this._component.planificari = this._cache.planificari || []
    this._component.processedPlanificari = this._cache.processedPlanificari || {}
    
    // Ensure the update is complete before continuing
    this._component.requestUpdate()
    await this._component.updateComplete

    // Debug log after update
    console.log('Component updated with:', {
      planificari: this._component.planificari,
      processedPlanificari: this._component.processedPlanificari
    })
  }

  async _resetComponentData() {
    if (!this._component) return
    
    this._component.planificari = []
    this._component.processedPlanificari = {}
    this._component.requestUpdate()
    await this._component.updateComplete
  }
}

export const listaPlanificariController = new ListaPlanificariController()