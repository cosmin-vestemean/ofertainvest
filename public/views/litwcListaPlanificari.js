import { LitElement, html, contextOferta } from '../client.js'
import {_cantitate_planificari } from '../utils/def_coloane.js'
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

export let ds_planificareNoua = []

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
    ds: { type: Array }
  }

  constructor() {
    super()
    this.angajati = [] // Initialize empty array
    this.isLoading = true
    this.modal = null
    this.planificari = []
    this.ds = []
  }

  connectedCallback() {
    super.connectedCallback()
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
      this.showToast('Warning', 'No valid offer selected', 'warning');
      this.planificari = [];
      this.ds = [];
      this.renderPlanificari();
      return;
    }
  
    try {
      this.isLoading = true;
      this.requestUpdate();
      
      // Show loading toast
      const loadingToastId = this.showToast('Loading', 'Retrieving schedules...', 'info', false);
      
      // Use the service instead of direct API call
      const result = await planificariService.getPlanificari();
      
      // Hide the loading toast
      this.hideToast(loadingToastId);
      
      if (!result.success) {
        this.showToast('Error', 'Failed to load schedules', 'danger');
        console.error('Failed to load planificari', result.error);
        this.planificari = [];
        this.ds = [];
      } else {
        this.planificari = result.data;
        if (this.planificari.length === 0) {
          this.showToast('Info', 'No schedules found', 'info');
        } else {
          this.showToast('Success', `Loaded ${this.planificari.length} schedules`, 'success');
        }
        console.info('Loaded planificari:', this.planificari);
      }
    } catch (error) {
      this.showToast('Error', 'Failed to load schedules', 'danger');
      console.error('Error loading planificari:', error);
      this.planificari = [];
      this.ds = [];
    } finally {
      this.isLoading = false;
      this.renderPlanificari();
      this.requestUpdate();
    }
  }
  
  /**
   * Shows a toast notification
   * @param {string} title - The title of the toast
   * @param {string} message - The message to display
   * @param {string} type - The type of toast (success, danger, warning, info)
   * @param {boolean} autoHide - Whether to auto hide the toast
   * @returns {string} The ID of the toast for reference
   */
  showToast(title, message, type = 'info', autoHide = true) {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }
    
    // Create a unique ID for this toast
    const toastId = `toast-${Date.now()}`;
    
    // Create the toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.id = toastId;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    if (autoHide) {
      toastEl.setAttribute('data-bs-delay', '3000');
      toastEl.setAttribute('data-bs-autohide', 'true');
    } else {
      toastEl.setAttribute('data-bs-autohide', 'false');
    }
    
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <strong>${title}</strong>: ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Add it to the container
    toastContainer.appendChild(toastEl);
    
    // Initialize and show using Bootstrap
    const toastInstance = new bootstrap.Toast(toastEl);
    toastInstance.show();
    
    return toastId;
  }
  
  /**
   * Hides a specific toast by ID
   * @param {string} toastId - The ID of the toast to hide
   */
  hideToast(toastId) {
    const toastEl = document.getElementById(toastId);
    if (toastEl) {
      const toastInstance = bootstrap.Toast.getInstance(toastEl);
      if (toastInstance) {
        toastInstance.hide();
      }
    }
  }

  async openPlanificare(id, table, hideAllBut = true) {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found')
      return
    }

    console.info('Opening planificare:', id)

    try {
      const header = this.planificari.find((p) => p.CCCPLANIFICARI === id)
      if (!header) {
        console.error('Failed to find planificare header')
        return
      }

      // Use the service to convert data
      const planificareCurenta = await planificariService.convertPlanificareData(header.linii)
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
    } catch (error) {
      console.error('Error processing planificare details:', error)
    }
  }

  renderPlanificari() {
    const table = tables.my_table7.element
    this.ds = this.planificari.map((p) => {
      const filtered = {}
      Object.keys(listaPlanificariMask).forEach((key) => {
        if (listaPlanificariMask[key].usefull) {
          filtered[key] = p[key]
        }
      })
      return filtered
    })

    table.ds = this.ds
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

  handlePlanificareNoua() {
    if (!this.validateDates()) return
    if (!ds_antemasuratori?.length) {
      console.warn('No antemasuratori available')
      return
    }

    if (!contextOferta?.CCCOFERTEWEB) {
      alert('Nu există o ofertă validă selectată')
      return
    }

    ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
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
                <div class="mb-3">
                  <label for="startDate" class="form-label">Start Date</label>
                  <input type="date" class="form-control" id="startDate" required />
                </div>
                <div class="mb-3">
                  <label for="endDate" class="form-label">End Date</label>
                  <input type="date" class="form-control" id="endDate" required />
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

  render() {
    if (this.isLoading) {
      return html`<div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>`
    }

    return html`
      <div class="toolbar mb-2">
        <button type="button" class="btn btn-primary btn-sm me-2" id="adaugaPlanificare">
          Adauga planificare
        </button>
        <button type="button" class="btn btn-secondary btn-sm me-2" @click="${() => this.loadPlanificari()}">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      <div class="planificari-stack">
        ${this.ds.map((item, index) => html`
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
              <button type="button" class="btn btn-primary btn-sm m-1" 
                @click="${() => this.openPlanificare(item.CCCPLANIFICARI, tables.tablePlanificareCurenta.element)}">
                <i class="bi bi-arrows-fullscreen"></i>
              </button>
            </div>
            ${this.renderPlanificareDetails(item)}
          </div>
        `)}
      </div>
      ${this.renderModal()}
    `
  }

  renderPlanificareDetails(item) {
    const header = this.planificari.find(p => p.CCCPLANIFICARI === item.CCCPLANIFICARI)
    if (!header) return null

    /*
    .documentHeader=${{
            responsabilPlanificare: header.RESPPLAN,
            responsabilExecutie: header.RESPEXEC,
            id: header.CCCPLANIFICARI
          }}
    .documentHeaderMask=${planificareHeaderMask}
    */

    const element = html`
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
    `

    this.updatePlanificareData(header)
    return element
  }

  async updatePlanificareData(header) {
    try {
      const convertedData = await planificariService.convertPlanificareData(header.linii)
      const element = this.querySelector(`#planificare-${header.CCCPLANIFICARI}`)
      if (element) {
        element.data = convertedData
      }
    } catch (error) {
      console.error('Error converting planificare data:', error)
    }
  }
}
customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
