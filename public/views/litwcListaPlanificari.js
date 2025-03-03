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
    isLoading: { type: Boolean, reflect: true },
    planificari: { type: Array },
    ds: { type: Array },
    contextValid: { type: Boolean }
  }

  constructor() {
    super()
    this.angajati = []
    this.isLoading = true
    this.modal = null
    this.planificari = []
    this.ds = []
    this.contextValid = false
  }

  connectedCallback() {
    super.connectedCallback()
    this.loadCssIfNeeded()
  }

  loadCssIfNeeded() {
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
      await this.loadEmployees()
      this.validateContext()
    } finally {
      this.isLoading = false
      this.setupEventListeners()
      this.initializeModal()
      this.requestUpdate()
    }
    await this.loadPlanificari()
  }

  async loadEmployees() {
    // First check context
    if (contextOferta?.angajati?.length > 0) {
      this.angajati = contextOferta.angajati
      return
    }

    // If not in context, load and cache
    try {
      const employees = await employeesService.loadEmployees()
      if (employees?.length > 0) {
        this.angajati = employees
        // Cache for other components
        contextOferta.angajati = employees
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      this.angajati = [] // Ensure we have an empty array
    }
  }

  validateContext() {
    this.contextValid = Boolean(contextOferta?.CCCOFERTEWEB)
    return this.contextValid
  }

  initializeModal() {
    // Lazy initialize modal when needed
    this.modal = null;
  }

  async loadPlanificari() {
    if (!this.validateContext()) {
      console.warn('No valid CCCOFERTEWEB found')
      this.planificari = []
      this.ds = []
      return
    }

    this.isLoading = true;
    try {
      // Use the service instead of direct API call
      const result = await planificariService.getPlanificari()
      
      if (!result.success) {
        console.error('Failed to load planificari', result.error)
        this.planificari = []
        this.ds = []
        return
      }
      
      this.updatePlanificari(result.data)
    } catch (error) {
      console.error('Error loading planificari:', error)
      this.planificari = []
      this.ds = []
    } finally {
      this.isLoading = false;
    }
  }

  updatePlanificari(data) {
    this.planificari = data
    this.processDisplayData()
  }

  processDisplayData() {
    this.ds = this.planificari.map((p) => {
      const filtered = {}
      Object.keys(listaPlanificariMask).forEach((key) => {
        if (listaPlanificariMask[key].usefull) {
          filtered[key] = p[key]
        }
      })
      return filtered
    })
    
    const table = tables.my_table7.element
    if (table) {
      table.ds = this.ds
    }
  }

  async openPlanificare(id, table, hideAllBut = true) {
    if (!this.validateContext()) return;

    console.info('Opening planificare:', id)

    try {
      const header = this.planificari.find((p) => p.CCCPLANIFICARI === id)
      if (!header) {
        console.error('Failed to find planificare header')
        return
      }

      // Use the service to convert data
      const planificareCurenta = await planificariService.convertPlanificareData(header.linii)
      
      this.configurePlanificareTable(table, planificareCurenta, header)

      if (hideAllBut) tables.hideAllBut([tables.tablePlanificareCurenta])
    } catch (error) {
      console.error('Error processing planificare details:', error)
    }
  }

  configurePlanificareTable(table, data, header) {
    Object.assign(table, {
      hasMainHeader: true,
      hasSubHeader: false,
      canAddInLine: true,
      mainMask: planificareDisplayMask,
      subsMask: planificareSubsDisplayMask,
      data,
      documentHeader: {
        responsabilPlanificare: header.RESPPLAN,
        responsabilExecutie: header.RESPEXEC,
        id: header.CCCPLANIFICARI
      },
      documentHeaderMask: planificareHeaderMask
    })
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
    if (!this.validateDates()) return;
    if (!this.validateContext()) {
      alert('Nu există o ofertă validă selectată')
      return;
    }
    if (!ds_antemasuratori?.length) {
      console.warn('No antemasuratori available')
      return;
    }

    const processedData = this.processAntemasuratori();
    const headerData = this.collectHeaderData();
    
    this.configurePlanificareNouaTable(processedData, headerData);
    tables.hideAllBut([tables.tablePlanificareCurenta]);
    this.modal?.hide();
  }
  
  processAntemasuratori() {
    ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
    ds_planificareNoua.forEach((parent) => {
      parent.content.forEach((item) => {
        item.object[_cantitate_planificari] = 0
        item.children?.forEach((child) => {
          child.object[_cantitate_planificari] = 0
        })
      })
    })
    return ds_planificareNoua;
  }
  
  collectHeaderData() {
    return {
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      responsabilPlanificare: document.getElementById('select1').value,
      responsabilExecutie: document.getElementById('select2').value
    };
  }
  
  configurePlanificareNouaTable(data, headerData) {
    const table = tables.tablePlanificareCurenta.element
    Object.assign(table, {
      hasMainHeader: true,
      hasSubHeader: false,
      canAddInLine: true,
      mainMask: planificareDisplayMask,
      subsMask: planificareSubsDisplayMask,
      data,
      documentHeader: headerData,
      documentHeaderMask: planificareHeaderMask
    })
  }

  saveLine(item, htmlElement, value) {
    try {
      const nr = parseFloat(value)
      item[_cantitate_planificari] = nr
    } catch (error) {
      console.log('error', error)
      alert('Valoare invalida')
    }
  }
  
  saveLineArticle(item, htmlElement, value) {
    this.saveLine(item, htmlElement, value)
  }

  saveLineSubArticle(item, htmlElement, value) {
    this.saveLine(item, htmlElement, value)
  }

  restorehtmlElement(element, value) {
    element.innerHTML = value
    element.disabled = false
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

  renderPlanificareDetails(item) {
    const header = this.planificari.find(p => p.CCCPLANIFICARI === item.CCCPLANIFICARI)
    if (!header) return null

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
        <button type="button" class="btn btn-secondary btn-sm me-2" @click="${async () => await this.loadPlanificari()}">
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
                      ${this.renderItemValue(key, props, item)}
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
  
  renderItemValue(key, props, item) {
    if (key === 'LOCKED') {
      return html`<i class="bi ${item[key] ? 'bi-lock-fill text-danger' : 'bi-unlock text-success'}"></i>`
    } else if (props.type === 'datetime') {
      return html`<span>${new Date(item[key]).toLocaleDateString()}</span>`
    } else {
      return html`<span>${item[key]}</span>`
    }
  }
}
customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
