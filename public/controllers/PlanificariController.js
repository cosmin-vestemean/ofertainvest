import { planificariService } from '../services/planificariService.js'
import { employeesService } from '../utils/employeesService.js'
import { contextOferta } from '../client.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

export class PlanificariController {
  constructor(view) {
    this.view = view
    this.state = {
      angajati: [],
      isLoading: true,
      planificari: [],
      processedPlanificari: {},
      modal: null
    }
  }

  async initialize() {
    await this.loadEmployees()
    await this.loadPlanificari()
    this.setupEventListeners()
  }

  setupEventListeners() {
    this.view.addEventListener('click', (e) => {
      if (e.target.id === 'adaugaPlanificare') {
        this.showPlanificareModal()
      }
    })
  }

  async loadEmployees() {
    try {
      if (contextOferta?.angajati?.length > 0) {
        this.state.angajati = contextOferta.angajati
      } else {
        const employees = await employeesService.loadEmployees()
        if (employees?.length > 0) {
          this.state.angajati = employees
          contextOferta.angajati = employees
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      this.state.angajati = []
    } finally {
      this.state.isLoading = false
      await this.view.updateComplete
      this.updateView()
    }
  }

  async loadPlanificari(forceRefresh = false) {
    if (!this.validateContext()) return

    this.state.isLoading = true
    this.updateView()

    try {
      const result = await planificariService.getPlanificari(forceRefresh)
      if (!result.success) {
        throw new Error('Eroare la încărcarea planificărilor')
      }

      this.state.planificari = this.transformPlanificariForDisplay(result.data)
      await this.preprocessAllPlanificariDetails()

      this.view.showToast(
        forceRefresh 
          ? 'Planificările au fost reîncărcate din baza de date' 
          : 'Planificările au fost încărcate cu succes',
        'success'
      )
    } catch (error) {
      this.view.showToast(error.message, 'danger')
      this.resetState()
    } finally {
      this.state.isLoading = false
      await this.view.updateComplete
      this.updateView()
    }
  }

  async toggleAllSubarticles() {
    const planificareComponents = this.view.querySelectorAll('litwc-planificare')
    let shouldExpand = !Array.from(planificareComponents).some(comp => 
      comp.querySelector('.bi-dash-square')
    )

    planificareComponents.forEach(component => {
      const parentRows = component.querySelectorAll('tr[data-index]')
      
      parentRows.forEach(row => {
        const index = row.getAttribute('data-index')
        const toggleIcon = row.querySelector('i')
        
        if (!toggleIcon) return

        const hasSubarticles = toggleIcon.classList.contains('bi-plus-square') ||
          toggleIcon.classList.contains('bi-dash-square')

        if (hasSubarticles) {
          const isExpanded = toggleIcon.classList.contains('bi-dash-square')
          if ((shouldExpand && !isExpanded) || (!shouldExpand && isExpanded)) {
            component.toggleSubarticles(parseInt(index))
          }
        }
      })
    })
  }

  validateContext() {
    if (!contextOferta?.CCCOFERTEWEB) {
      this.view.showToast('Nu există o ofertă validă selectată', 'warning')
      this.resetState()
      return false
    }
    return true
  }

  resetState() {
    this.state.planificari = []
    this.state.processedPlanificari = {}
    this.updateView()
  }

  updateView() {
    Object.assign(this.view, this.state)
    this.view.requestUpdate()
  }

  // ... rest of the controller methods
}
