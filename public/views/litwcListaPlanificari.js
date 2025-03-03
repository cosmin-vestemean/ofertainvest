import { LitElement, html, contextOferta } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { tables } from '../utils/tables.js'
import {
  planificareDisplayMask,
  planificareSubsDisplayMask,
  planificareHeaderMask,
  listaPlanificariMask
} from './masks.js'
import { employeesService } from '../utils/employeesService.js'
import { planificariController } from '../controllers/planificariController.js'

/* global bootstrap */

export let ds_planificareNoua = []

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
    // Use the controller instead
    const result = await planificariController.loadPlanificari()
    
    if (result.success) {
      this.planificari = result.data
    } else {
      this.planificari = []
    }
    
    this.ds = []
    this.renderPlanificari()
  }

  async openPlanificare(id, table, hideAllBut = true) {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found')
      return
    }

    console.info('Opening planificare:', id)
    
    // Use controller
    const result = await planificariController.getPlanificareDetails(id)
    if (!result.success) {
      console.error('Failed to get planificare details:', result.error)
      return
    }

    Object.assign(table, {
      hasMainHeader: true,
      hasSubHeader: false,
      canAddInLine: true,
      mainMask: planificareDisplayMask,
      subsMask: planificareSubsDisplayMask,
      data: result.data,
      documentHeader: {
        responsabilPlanificare: result.header.RESPPLAN,
        responsabilExecutie: result.header.RESPEXEC,
        id: result.header.CCCPLANIFICARI
      },
      documentHeaderMask: planificareHeaderMask
    })

    if (hideAllBut) tables.hideAllBut([tables.tablePlanificareCurenta])
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
    
    const validation = planificariController.validateDateRange(startDate, endDate)
    if (!validation.valid) {
      alert(validation.message)
      return false
    }
    
    return true
  }

  handlePlanificareNoua() {
    if (!this.validateDates()) return
    
    if (!contextOferta?.CCCOFERTEWEB) {
      alert('Nu există o ofertă validă selectată')
      return
    }

    ds_planificareNoua = planificariController.preparePlanificareNoua()
    if (ds_planificareNoua.length === 0) {
      console.warn('No antemasuratori available')
      return
    }

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
      const convertedData = await planificariController.convertPlanificareData(header.linii)
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
