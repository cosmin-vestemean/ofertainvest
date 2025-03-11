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
// Import the new service
import { planificariService } from '../services/planificariService.js'

/* global bootstrap */

/**
 * LitwcListaPlanificari is a custom web component that extends LitElement.
 * It is responsible for managing and displaying a list of planificari (schedules).
 * The component handles loading, rendering, and interacting with planificari data.
 */
class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    isLoading: { type: Boolean },
    planificari: { type: Array },
    processedPlanificari: { type: Object }
  }

  constructor() {
    super()
    this.angajati = [] // Initialize empty array
    this.isLoading = true
    this.modal = null
    this.planificari = []
    this.processedPlanificari = {} // Store processed data by CCCPLANIFICARI

    // Add CSS link to the document if not already present
    if (!document.querySelector('link[href="../styles/planificari.css"]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '../styles/planificari.css'
      document.head.appendChild(link)
    }
  }

  createRenderRoot() {
    return this
  }

  setupEventListeners() {
    this.addEventListener('click', (e) => {
      if (e.target.id === 'adaugaPlanificare') {
        this.showPlanificareModal()
      }
    })
  }

  async firstUpdated() {
    try {
      // First check context
      if (contextOferta?.angajati?.length > 0) {
        this.angajati = contextOferta.angajati
      } else {
        // If not in context, load and cache
        const employees = await employeesService.loadEmployees()
        if (employees?.length > 0) {
          this.angajati = employees
          // Cache for other components
          contextOferta.angajati = employees
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      this.angajati = [] // Ensure we have an empty array
    } finally {
      this.isLoading = false
      this.setupEventListeners()
      this.requestUpdate()
    }
    this.loadPlanificari()
  }

  async loadPlanificari() {
    if (!contextOferta?.CCCOFERTEWEB) {
      this.showToast('Nu există o ofertă validă selectată', 'warning')
      this.planificari = []
      this.processedPlanificari = {}
      this.requestUpdate() // Use requestUpdate instead of renderPlanificari
      return
    }

    this.isLoading = true
    try {
      // Use the service to get all planificari data
      const result = await planificariService.getPlanificari()

      if (!result.success) {
        this.showToast('Eroare la încărcarea planificărilor', 'danger')
        this.planificari = []
        this.processedPlanificari = {}
        this.requestUpdate() // Use requestUpdate instead of renderPlanificari
        return
      }

      // Process and transform data for display
      this.planificari = result.data.map((p) => {
        // Add display-friendly properties based on the mask
        const displayItem = { ...p }
        Object.keys(listaPlanificariMask).forEach((key) => {
          if (listaPlanificariMask[key].usefull) {
            displayItem[key] = p[key]
          }
        })
        return displayItem
      })

      // Pre-process all planificare details
      await this.preprocessAllPlanificariDetails()

      console.info('Loaded planificari:', this.planificari)

      // No need to call a separate render function, just trigger an update
      this.showToast('Planificările au fost încărcate cu succes', 'success')
    } catch (error) {
      this.showToast('Eroare la încărcarea planificărilor: ' + error.message, 'danger')
      this.planificari = []
      this.processedPlanificari = {}
    } finally {
      this.isLoading = false
      await this.updateComplete
      this.requestUpdate()
    }
  }

  async preprocessAllPlanificariDetails() {
    try {
      // Process all planificari data in parallel
      const processingPromises = this.planificari.map(async (header) => {
        try {
          const convertedData = await planificariService.convertPlanificareData(header.linii)
          this.processedPlanificari[header.CCCPLANIFICARI] = convertedData
        } catch (error) {
          console.error(`Error pre-processing planificare ${header.CCCPLANIFICARI}:`, error)
          this.processedPlanificari[header.CCCPLANIFICARI] = []
        }
      })

      // Wait for all processing to complete
      await Promise.all(processingPromises)
      this.showToast('Datele au fost procesate cu succes', 'success')
    } catch (error) {
      this.showToast('Eroare la procesarea datelor: ' + error.message, 'danger')
    }
  }

  async openPlanificare(id, table, hideAllBut = true) {
    if (!contextOferta?.CCCOFERTEWEB) {
      this.showToast('Nu există o ofertă validă selectată', 'warning')
      return
    }

    console.info('Opening planificare:', id)

    try {
      const header = this.planificari.find((p) => p.CCCPLANIFICARI === id)
      if (!header) {
        console.error('Failed to find planificare header')
        return
      }

      // Use pre-processed data instead of fetching again
      const planificareCurenta = this.processedPlanificari[id] || []
      console.info('Using cached planificare details:', planificareCurenta)

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

  validateDates() {
    const startDate = document.getElementById('startDate').value
    const endDate = document.getElementById('endDate').value

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date')
      return false
    }

    return true
  }

  handlePlanificareNoua() {
    if (!this.validateDates()) {
      this.showToast('Vă rugăm să selectați datele corect', 'warning')
      return
    }
    if (!ds_antemasuratori?.length) {
      this.showToast('Nu există antemăsurători disponibile', 'warning')
      return
    }

    if (!contextOferta?.CCCOFERTEWEB) {
      this.showToast('Nu există o ofertă validă selectată', 'warning')
      return
    }

    try {
      let ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
      ds_planificareNoua.forEach((parent) => {
        parent.content.forEach((item) => {
          item.object[_cantitate_planificari] = 0
          item.children?.forEach((child) => {
            child.object[_cantitate_planificari] = 0
          })
        })
      })

      const table = tables.tablePlanificareCurenta.element
      Object.assign(table, {
        hasMainHeader: true,
        hasSubHeader: false,
        canAddInLine: true,
        mainMask: planificareDisplayMask,
        subsMask: planificareSubsDisplayMask,
        data: ds_planificareNoua,
        documentHeader: {
          responsabilPlanificare: document.getElementById('select1').value,
          responsabilExecutie: document.getElementById('select2').value
        },
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

      <div class="toolbar mb-2">
        <button type="button" class="btn btn-primary btn-sm me-2" id="adaugaPlanificare">
          Adauga planificare
        </button>
        <button type="button" class="btn btn-secondary btn-sm me-2" @click="${() => this.loadPlanificari()}">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
        <button type="button" class="btn btn-outline-secondary btn-sm me-2" @click="${() => this.toggleAllSubarticles()}">
          <i class="bi bi-arrows-expand"></i> Expand/Collapse All
        </button>
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
    const header = this.planificari.find((p) => p.CCCPLANIFICARI === item.CCCPLANIFICARI)
    if (!header) return null

    // Use the pre-processed data
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

  // Gets planificari filtered by both RESPPLAN and RESPEXEC
  getPlanificariByResponsabili({ RESPPLAN, RESPEXEC } = {}) {
    if (!this.planificari?.length) {
      return []
    }

    return this.planificari.filter((planificare) => {
      return (
        (!RESPPLAN || planificare.RESPPLAN === RESPPLAN) && (!RESPEXEC || planificare.RESPEXEC === RESPEXEC)
      )
    })
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

    // Show a toast message
    this.showToast(
      shouldExpand ? 'All sections expanded' : 'All sections collapsed',
      'info'
    );
  }
}
customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
