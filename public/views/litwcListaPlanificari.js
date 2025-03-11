import { LitElement, html, contextOferta } from '../client.js'
import { tables } from '../utils/tables.js'
import {
  planificareDisplayMask,
  planificareSubsDisplayMask,
  planificareHeaderMask,
  listaPlanificariMask
} from './masks.js'
import { planificariController } from '../services/planificariControllerService.js'

/* global bootstrap */

/**
 * LitwcListaPlanificari is a custom web component that extends LitElement.
 * It is responsible for displaying a list of planificari (schedules).
 * The component handles rendering and user interactions, while business logic
 * is delegated to the planificariController service.
 */
class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    isLoading: { type: Boolean },
    planificari: { type: Array },
    processedPlanificari: { type: Object },
    errorMessage: { type: String }
  }

  constructor() {
    super()
    // UI state
    this.angajati = []
    this.isLoading = true
    this.modal = null
    this.planificari = []
    this.processedPlanificari = {}
    this.errorMessage = null

    // Add CSS link to the document if not already present
    if (!document.querySelector('link[href="../styles/planificari.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '../styles/planificari.css'
      document.head.appendChild(link)
    }
    
    // Set up event listeners for the controller
    this.setupControllerEventListeners()
  }

  /**
   * Set up event listeners for the controller service
   */
  setupControllerEventListeners() {
    // Handle loading state changes
    planificariController.addEventListener('loadingStarted', () => {
      this.isLoading = true
      this.requestUpdate()
    })
    
    planificariController.addEventListener('loadingFinished', () => {
      this.isLoading = false
      this.requestUpdate()
    })
    
    // Handle data changes
    planificariController.addEventListener('employeesLoaded', (event) => {
      this.angajati = event.data
      this.requestUpdate()
    })
    
    planificariController.addEventListener('planificariLoaded', (event) => {
      // Map data for display
      this.planificari = event.data.map((p) => {
        const displayItem = { ...p }
        Object.keys(listaPlanificariMask).forEach((key) => {
          if (listaPlanificariMask[key].usefull) {
            displayItem[key] = p[key]
          }
        })
        return displayItem
      })
      
      this.processedPlanificari = event.processedData
      this.showToast(event.message, 'success')
      this.requestUpdate()
    })
    
    // Handle errors
    planificariController.addEventListener('error', (event) => {
      this.errorMessage = event.message
      this.showToast(event.message, 'danger')
      this.requestUpdate()
    })
  }

  createRenderRoot() {
    return this
  }

  setupUIEventListeners() {
    this.addEventListener('click', (e) => {
      if (e.target.id === 'adaugaPlanificare') {
        this.showPlanificareModal()
      }
    })
  }

  async firstUpdated() {
    this.setupUIEventListeners()
    
    // Initialize the controller
    await planificariController.init()
    
    // Update local state from controller
    this.angajati = planificariController.angajati
    this.planificari = planificariController.planificari
    this.processedPlanificari = planificariController.processedPlanificari
    this.isLoading = false
    
    this.requestUpdate()
  }

  async loadPlanificari(forceRefresh = false) {
    await planificariController.loadPlanificari(forceRefresh)
  }

  async openPlanificare(id, table, hideAllBut = true) {
    if (!contextOferta?.CCCOFERTEWEB) {
      this.showToast('Nu există o ofertă validă selectată', 'warning')
      return
    }

    console.info('Opening planificare:', id)

    try {
      // Get planificare data from controller
      const planificare = planificariController.getPlanificareById(id)
      if (!planificare) {
        throw new Error('Failed to find planificare')
      }

      const { header, data: planificareCurenta } = planificare
      console.info('Using cached planificare details:', planificareCurenta)

      // Configure table
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

      if (hideAllBut) tables.hideAllBut([tables.tablePlanificareCurenta])
      this.showToast('Planificare deschisă cu succes', 'success')
    } catch (error) {
      this.showToast('Eroare la deschiderea planificării: ' + error.message, 'danger')
    }
  }

  showPlanificareModal() {
    if (!this.modal) {
      this.modal = new bootstrap.Modal(document.getElementById('planificareModal'), {
        keyboard: true,
        backdrop: false
      })
    }
    this.modal.show()
  }

  handlePlanificareNoua() {
    const startDate = document.getElementById('startDate').value
    const endDate = document.getElementById('endDate').value
    
    // Validate using controller
    if (!planificariController.validateDates(startDate, endDate)) {
      this.showToast('Vă rugăm să selectați datele corect', 'warning')
      return
    }

    try {
      // Get new planificare data from controller
      const planificareNoua = planificariController.createNewPlanificare({
        responsabilPlanificare: document.getElementById('select1').value,
        responsabilExecutie: document.getElementById('select2').value
      })

      const table = tables.tablePlanificareCurenta.element
      Object.assign(table, {
        hasMainHeader: true,
        hasSubHeader: false,
        canAddInLine: true,
        mainMask: planificareDisplayMask,
        subsMask: planificareSubsDisplayMask,
        data: planificareNoua.data,
        documentHeader: planificareNoua.header,
        documentHeaderMask: planificareHeaderMask
      })

      tables.hideAllBut([tables.tablePlanificareCurenta])
      this.modal?.hide()
      this.showToast('Planificare nouă creată cu succes', 'success')
    } catch (error) {
      this.showToast('Eroare la crearea planificării: ' + error.message, 'danger')
    }
  }

  renderEmployeeSelect(id, label) {
    return html`
      <div class="mb-3">
        <label for="${id}" class="form-label">${label}</label>
        <select class="form-select" id="${id}">
          ${this.angajati.map((angajat) => html`<option value="${angajat.PRSN}">${angajat.NAME2}</option>`)}
        </select>
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
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" id="showDates" @change="${(e) => {
        const dateFields = this.querySelector('.date-fields');
        dateFields.style.display = e.target.checked ? 'block' : 'none';
      }}">
                  <label class="form-check-label" for="showDates">Include date</label>
                </div>
                
                <div class="date-fields" style="display: none">
                  <div class="mb-3">
                    <label for="startDate" class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="startDate" />
                  </div>
                  <div class="mb-3">
                    <label for="endDate" class="form-label">End Date</label>
                    <input type="date" class="form-control" id="endDate" />
                  </div>
                </div>

                ${this.renderEmployeeSelect('select1', 'Responsabil planificare')}
                ${this.renderEmployeeSelect('select2', 'Responsabil executie')}
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" @click="${() => this.handlePlanificareNoua()}">
                Planificare noua
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  showToast(message, type = 'info') {
    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      let toastContainer = this.querySelector('#toast-container')

      // Create toast container if it doesn't exist
      if (!toastContainer) {
        toastContainer = document.createElement('div')
        toastContainer.id = 'toast-container'
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3'
        this.appendChild(toastContainer)
      }

      const toastEl = document.createElement('div')
      toastEl.className = `toast align-items-center text-white bg-${type} border-0`
      toastEl.setAttribute('role', 'alert')
      toastEl.setAttribute('aria-live', 'assertive')
      toastEl.setAttribute('aria-atomic', 'true')

      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `

      toastContainer.appendChild(toastEl)
      const toast = new bootstrap.Toast(toastEl)
      toast.show()

      // Remove toast after it's hidden
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove())
    })
  }

  render() {
    if (this.isLoading) {
      return html`<div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>`
    }

    return html`
      <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>

      <div class="toolbar d-flex align-items-center mb-3 p-2 bg-light border rounded shadow-sm">
        <div class="btn-group me-auto" role="group" aria-label="Basic actions">
          <button type="button" class="btn btn-primary btn-sm" id="adaugaPlanificare" title="Adaugă planificare nouă">
            <i class="bi bi-plus-lg me-1"></i> Adaugă planificare
          </button>
        </div>
        
        <div class="btn-group me-2" role="group" aria-label="Data operations">
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="${() => this.loadPlanificari()}" title="Reîncarcă din cache">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
          <button type="button" class="btn btn-outline-warning btn-sm" @click="${() => this.loadPlanificari(true)}" title="Reîncarcă din baza de date"></button>
            <i class="bi bi-cloud-download"></i> Force Refresh
          </button>
        </div>
        
        <div class="btn-group" role="group" aria-label="Display options"></div>
          <button type="button" class="btn btn-outline-info btn-sm" @click="${() => this.toggleAllSubarticles()}" title="Expandează sau restrânge toate secțiunile">
            <i class="bi bi-arrows-expand"></i> Expand/Collapse
          </button>
        </div>
      </div>

      <div class="planificari-stack">
        ${this.planificari.map(
      (item, index) => html`
            <div class="planificare-card">
              <div class="card-header">
                <div class="card-header-content">
                  <div class="header-item">
                    <span class="text-info mx-2">#${index + 1}</span>
                  </div>
                  ${Object.entries(listaPlanificariMask)
          .filter(([_, props]) => props.visible)
          .map(
            ([key, props]) => html`
                        <div class="header-item">
                          <span class="text-muted">${props.label}:</span>
                          <span class="text-info">${item[key]}</span>
                        </div>
                      `
          )}
                </div>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm m-1"
                  @click="${() =>
          this.openPlanificare(item.CCCPLANIFICARI, tables.tablePlanificareCurenta.element)}"
                >
                  <i class="bi bi-arrows-fullscreen"></i>
                </button>
              </div>
              ${this.renderPlanificareDetails(item)}
            </div>
          `
    )}
      </div>
      ${this.renderModal()}
    `
  }

  renderPlanificareDetails(item) {
    const planificareData = this.processedPlanificari[item.CCCPLANIFICARI] || []

    return html`
      <div class="card-body">
        <litwc-planificare
          id="planificare-${item.CCCPLANIFICARI}"
          .hasMainHeader=${true}
          .hasSubHeader=${false}
          .canAddInLine=${true}
          .mainMask=${planificareDisplayMask}
          .subsMask=${planificareSubsDisplayMask}
          .data=${planificareData}
        ></litwc-planificare>
      </div>
    `
  }

  toggleAllSubarticles() {
    // Get all planificare components that are currently rendered
    const planificareComponents = this.querySelectorAll('litwc-planificare');

    // Track whether we want to expand or collapse
    // We'll determine this by checking the first component's state
    let shouldExpand = true;

    // Check if any components have expanded rows (look for dash-square icons)
    const anyExpanded = Array.from(planificareComponents).some(component =>
      component.querySelector('.bi-dash-square')
    );

    // If any are expanded, we want to collapse all
    shouldExpand = !anyExpanded;

    planificareComponents.forEach(component => {
      // Get all rows with child elements (those with data-index attribute)
      const parentRows = component.querySelectorAll('tr[data-index]');

      parentRows.forEach(row => {
        const index = row.getAttribute('data-index');
        const toggleIcon = row.querySelector('i');

        // Only process rows that have the toggle icon
        if (!toggleIcon) return;

        // Check if this row has subarticles
        const hasSubarticles = toggleIcon.classList.contains('bi-plus-square') ||
          toggleIcon.classList.contains('bi-dash-square');

        if (hasSubarticles) {
          const isExpanded = toggleIcon.classList.contains('bi-dash-square');

          // If we should expand and it's collapsed, or we should collapse and it's expanded
          if ((shouldExpand && !isExpanded) || (!shouldExpand && isExpanded)) {
            // Call the UI1 toggleSubarticles method (which the component inherits)
            component.toggleSubarticles(parseInt(index));
          }
        }
      });
    });
  }
  
  // Cleanup event listeners when component is disconnected
  disconnectedCallback() {
    super.disconnectedCallback();
    // We would clean up event listeners here if needed
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
