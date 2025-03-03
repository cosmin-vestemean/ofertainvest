import { LitElement, html, contextOferta } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import {
  planificareDisplayMask,
  planificareSubsDisplayMask,
  planificareHeaderMask,
  listaPlanificariMask
} from './masks.js'
import { employeesService } from '../utils/employeesService.js'
import { planificariService } from '../services/planificariService.js'

/* global bootstrap */

// Move export to a proper state management pattern or context
export let ds_planificareNoua = []

/**
 * LitwcListaPlanificari component for managing and displaying planificari (schedules)
 */
class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array }, 
    planificari: { type: Array },
    isLoading: { type: Boolean },
    hasError: { type: Boolean },
    errorMessage: { type: String }
  }

  constructor() {
    super()
    this.angajati = []
    this.planificari = []
    this.isLoading = true
    this.hasError = false
    this.errorMessage = ''
    this.modal = null
  }

  /**
   * Create shadow DOM - we disable it to inherit parent styles
   */
  createRenderRoot() {
    return this
  }

  /**
   * Load CSS dependencies once when component connects
   */
  connectedCallback() {
    super.connectedCallback()
    this._loadCss()
  }

  /**
   * Load required resources after first render 
   */
  async firstUpdated() {
    try {
      await Promise.all([
        this._loadEmployees(),
        this._loadPlanificari()
      ])
    } catch (error) {
      this._handleError(error, 'Failed to initialize component')
    } finally {
      this.isLoading = false
    }

    // Set up event delegation once
    this.addEventListener('click', this._handleClick.bind(this))
  }

  /**
   * Load CSS stylesheet once if not already present
   */
  _loadCss() {
    if (!document.querySelector('link[href="../styles/planificari.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '../styles/planificari.css'
      document.head.appendChild(link)
    }
  }

  /**
   * Handle delegated click events
   */
  _handleClick(e) {
    if (e.target.id === 'adaugaPlanificare') {
      this._showModal()
    } else if (e.target.matches('.refresh-btn')) {
      this._loadPlanificari()
    } else if (e.target.matches('.create-btn')) {
      this._createNewPlanificare()
    } else if (e.target.closest('.open-planificare-btn')) {
      const button = e.target.closest('.open-planificare-btn')
      const id = button.dataset.id
      if (id) this._openPlanificare(id)
    }
  }

  /**
   * Load employees from context or service
   */
  async _loadEmployees() {
    if (contextOferta?.angajati?.length > 0) {
      this.angajati = contextOferta.angajati
      return
    }
    
    try {
      const employees = await employeesService.loadEmployees()
      if (employees?.length > 0) {
        this.angajati = employees
        contextOferta.angajati = employees // Cache for other components
      }
    } catch (error) {
      this._handleError(error, 'Failed to load employees')
      this.angajati = [] // Ensure we have an empty array
    }
  }

  /**
   * Load planificari data from service
   */
  async _loadPlanificari() {
    if (!contextOferta?.CCCOFERTEWEB) {
      this._handleError(null, 'No valid offer context')
      return
    }

    try {
      this.isLoading = true
      const result = await planificariService.getPlanificari()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load planificari')
      }
      
      // Process data to include only needed fields plus original data
      this.planificari = result.data.map(p => {
        const filtered = Object.fromEntries(
          Object.entries(listaPlanificariMask)
            .filter(([_, props]) => props.usefull)
            .map(([key]) => [key, p[key]])
        )
        return { ...filtered, linii: p.linii, CCCPLANIFICARI: p.CCCPLANIFICARI }
      })
      
      this.hasError = false
    } catch (error) {
      this._handleError(error, 'Error loading planificari')
      this.planificari = []
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Handle errors consistently
   */
  _handleError(error, defaultMessage) {
    console.error(defaultMessage, error)
    this.hasError = true
    this.errorMessage = error?.message || defaultMessage
  }

  /**
   * Show modal for creating new planificare
   */
  _showModal() {
    if (!this.modal) {
      this.modal = new bootstrap.Modal(document.getElementById('planificareModal'), {
        keyboard: true,
        backdrop: false
      })
    }
    this.modal.show()
  }

  /**
   * Validate date inputs from modal
   */
  _validateDates() {
    const startDate = document.getElementById('startDate').value
    const endDate = document.getElementById('endDate').value

    if (!startDate || !endDate) {
      alert('Please select both start and end dates')
      return false
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date')
      return false
    }

    return true
  }

  /**
   * Create new planificare from form data
   */
  _createNewPlanificare() {
    if (!this._validateDates() || !contextOferta?.CCCOFERTEWEB) {
      alert('Missing required data')
      return
    }

    if (!ds_antemasuratori?.length) {
      alert('No antemasuratori available')
      return
    }

    // Create deep copy and initialize quantities
    ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
    ds_planificareNoua.forEach(parent => {
      parent.content.forEach(item => {
        item.object[_cantitate_planificari] = 0
        item.children?.forEach(child => {
          child.object[_cantitate_planificari] = 0
        })
      })
    })

    // Configure table with form data
    const table = tables.tablePlanificareCurenta.element
    Object.assign(table, {
      hasMainHeader: true,
      hasSubHeader: false,
      canAddInLine: true,
      mainMask: planificareDisplayMask,
      subsMask: planificareSubsDisplayMask,
      data: ds_planificareNoua,
      documentHeader: {
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        responsabilPlanificare: document.getElementById('select1').value,
        responsabilExecutie: document.getElementById('select2').value
      },
      documentHeaderMask: planificareHeaderMask
    })

    tables.hideAllBut([tables.tablePlanificareCurenta])
    this.modal?.hide()
  }

  /**
   * Open existing planificare by ID
   */
  async _openPlanificare(id) {
    if (!contextOferta?.CCCOFERTEWEB) {
      this._handleError(null, 'No valid offer context')
      return
    }

    try {
      const header = this.planificari.find(p => p.CCCPLANIFICARI === id)
      if (!header) {
        throw new Error('Failed to find planificare header')
      }

      // Convert data using service
      const planificareCurenta = await planificariService.convertPlanificareData(header.linii)
      
      // Configure table with data
      const table = tables.tablePlanificareCurenta.element
      Object.assign(table, {
        hasMainHeader: true,
        hasSubHeader: false,
        canAddInLine: true,
        mainMask: planificareDisplayMask,
        subsMask: planificareSubsDisplayMask,
        data: planificareCurenta,
        documentHeader: {
          responsabilPlanificare: header.RESPPLAN,
          responsabilExecutie: header.RESPEXEC,
          id: header.CCCPLANIFICARI
        },
        documentHeaderMask: planificareHeaderMask
      })

      tables.hideAllBut([tables.tablePlanificareCurenta])
    } catch (error) {
      this._handleError(error, 'Error opening planificare')
    }
  }

  /**
   * Update a specific planificare component with data
   */
  async _updatePlanificareData(item) {
    if (!item) return
    
    try {
      const convertedData = await planificariService.convertPlanificareData(item.linii)
      const element = this.querySelector(`#planificare-${item.CCCPLANIFICARI}`)
      if (element) {
        element.data = convertedData
      }
    } catch (error) {
      console.error('Error converting planificare data:', error)
    }
  }

  /**
   * Render methods split by responsibility for better maintenance
   */
  
  renderToolbar() {
    return html`
      <div class="toolbar mb-2">
        <button type="button" class="btn btn-primary btn-sm me-2" id="adaugaPlanificare">
          Adauga planificare
        </button>
        <button type="button" class="btn btn-secondary btn-sm me-2 refresh-btn">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
    `
  }

  renderModal() {
    return html`
      <div class="modal" id="planificareModal" tabindex="-1">
        <div role="dialog" class="modal-dialog modal-dialog-scrollable modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Adauga Executant</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="mb-3">
                  <label for="startDate" class="form-label">Start Date</label>
                  <input type="date" class="form-control" id="startDate" required />
                </div>
                <div class="mb-3">
                  <label for="endDate" class="form-label">End Date</label>
                  <input type="date" class="form-control" id="endDate" required />
                </div>
                ${this._renderEmployeeSelect('select1', 'Responsabil planificare')}
                ${this._renderEmployeeSelect('select2', 'Responsabil executie')}
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary create-btn">
                Planificare noua
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  _renderEmployeeSelect(id, label) {
    return html`
      <div class="mb-3">
        <label for="${id}" class="form-label">${label}</label>
        <select class="form-select" id="${id}">
          ${this.angajati.map((angajat) => html`<option value="${angajat.PRSN}">${angajat.NAME2}</option>`)}
        </select>
      </div>
    `
  }

  renderPlanificareCard(item, index) {
    if (!item) return null
    
    return html`
      <div class="planificare-card">
        <div class="card-header">
          <div class="card-header-content">
            <div class="header-item">
              <strong>#${index + 1}</strong>
            </div>
            ${Object.entries(listaPlanificariMask)
              .filter(([_, props]) => props.visible)
              .map(([key, props]) => html`
                <div class="header-item">
                  <span class="text-muted">${props.label}:</span>
                  ${key === 'LOCKED' 
                    ? html`<i class="bi ${item[key] ? 'bi-lock-fill text-danger' : 'bi-unlock text-success'}"></i>`
                    : props.type === 'datetime'
                      ? html`<span>${new Date(item[key]).toLocaleDateString()}</span>`
                      : html`<span>${item[key]}</span>`
                  }
                </div>
              `)}
          </div>
          <button type="button" class="btn btn-primary btn-sm m-1 open-planificare-btn" 
            data-id="${item.CCCPLANIFICARI}">
            <i class="bi bi-arrows-fullscreen"></i>
          </button>
        </div>
        <div class="card-body">
          <litwc-planificare
            id="planificare-${item.CCCPLANIFICARI}"
            .hasMainHeader=${true}
            .hasSubHeader=${false}
            .canAddInLine=${true}
            .mainMask=${planificareDisplayMask}
            .subsMask=${planificareSubsDisplayMask}
            .data=${[]}
          ></litwc-planificare>
        </div>
      </div>
    `
  }

  renderPlanificariList() {
    return html`
      <div class="planificari-stack">
        ${this.planificari.map((item, index) => {
          // Schedule update for this item's data
          setTimeout(() => this._updatePlanificareData(item), 0)
          return this.renderPlanificareCard(item, index)
        })}
      </div>
    `
  }

  renderError() {
    return html`
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        ${this.errorMessage || 'An error occurred'}
      </div>
    `
  }

  renderEmpty() {
    return html`
      <div class="alert alert-info">
        No planificari available. Click "Adauga planificare" to create one.
      </div>
    `
  }

  renderLoading() {
    return html`
      <div class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `
  }

  /**
   * Main render method with conditional states
   */
  render() {
    // Always render the toolbar and modal
    const toolbar = this.renderToolbar()
    const modal = this.renderModal()
    
    // Conditional content based on state
    let content
    if (this.isLoading) {
      content = this.renderLoading()
    } else if (this.hasError) {
      content = this.renderError()
    } else if (!this.planificari || this.planificari.length === 0) {
      content = this.renderEmpty()
    } else {
      content = this.renderPlanificariList()
    }

    return html`
      ${toolbar}
      ${content}
      ${modal}
    `
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
