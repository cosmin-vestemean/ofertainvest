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

/**
 * LitwcListaPlanificari is a custom web component that extends LitElement.
 * It is responsible for managing and displaying a list of planificari (schedules).
 * The component handles loading, rendering, and interacting with planificari data.
 */
class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    isLoading: { type: Boolean },
    planificari: { type: Array }
  }

  constructor() {
    super()
    this.angajati = []
    this.isLoading = true
    this.modal = null
    this.planificari = []
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
    await this.loadPlanificari()
  }

  async loadPlanificari() {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found')
      this.planificari = []
      this.requestUpdate();
      return
    }

    try {
      // Use the service instead of direct API call
      const result = await planificariService.getPlanificari()
      
      if (!result.success) {
        console.error('Failed to load planificari', result.error)
        this.planificari = []
        this.requestUpdate();
        return
      }
      
      // Process and pre-convert planificari data for immediate rendering
      await this.updatePlanificari(result.data)
    } catch (error) {
      console.error('Error loading planificari:', error)
      this.planificari = []
      this.requestUpdate();
    }
  }

  async updatePlanificari(data) {
    // Process and convert details data upfront for all planificari
    this.planificari = await Promise.all(data.map(async (p) => {
      const filtered = {}
      Object.keys(listaPlanificariMask).forEach((key) => {
        if (listaPlanificariMask[key].usefull) {
          filtered[key] = p[key]
        }
      })
      
      // Pre-process the details data for immediate rendering
      const processedDetails = await planificariService.convertPlanificareData(p.linii)
      
      // Return a complete object with header info and processed details
      return { 
        ...filtered, 
        CCCPLANIFICARI: p.CCCPLANIFICARI,
        linii: p.linii,
        processedDetails: processedDetails
      }
    }));
    
    this.requestUpdate();
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

      // Use the pre-processed data
      const planificareCurenta = header.processedDetails
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
      alert('Vă rugăm să selectați ambele date')
      return false
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Data de început nu poate fi după data de sfârșit')
      return false
    }

    return true
  }

  async handlePlanificareNoua() {
    if (!this.validateDates()) return
    if (!ds_antemasuratori?.length) {
      console.warn('Nu există antemăsurători disponibile')
      alert('Nu există antemăsurători disponibile')
      return
    }

    if (!contextOferta?.CCCOFERTEWEB) {
      alert('Nu există o ofertă validă selectată')
      return
    }

    // Create a deep copy of ds_antemasuratori
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
              <h5 class="modal-title">Adaugă planificare nouă</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="mb-3">
                  <label for="startDate" class="form-label">Data de început</label>
                  <input type="date" class="form-control" id="startDate" required />
                </div>
                <div class="mb-3">
                  <label for="endDate" class="form-label">Data de sfârșit</label>
                  <input type="date" class="form-control" id="endDate" required />
                </div>
                ${this.renderEmployeeSelect('select1', 'Responsabil planificare')}
                ${this.renderEmployeeSelect('select2', 'Responsabil execuție')}
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Închide</button>
              <button type="button" class="btn btn-primary" @click="${() => this.handlePlanificareNoua()}">
                Planificare nouă
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
        <span class="visually-hidden">Se încarcă...</span>
      </div>`
    }

    return html`
      <div class="toolbar mb-2">
        <button type="button" class="btn btn-primary btn-sm me-2" id="adaugaPlanificare">
          Adaugă planificare
        </button>
        <button type="button" class="btn btn-secondary btn-sm me-2" @click="${async () => await this.loadPlanificari()}">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      ${this.planificari.length === 0 
        ? html`<div class="alert alert-info">Nu există planificări. Apăsați "Adaugă planificare" pentru a crea una.</div>` 
        : this.renderAccordion()}
      
      ${this.renderModal()}
    `
  }

  renderAccordion() {
    // Group planificari by RESPPLAN and RESPEXEC
    const groupedPlanificari = this.groupPlanificariByResponsabili()
    
    return html`
      <div class="accordion" id="planificariAccordion">
        ${Object.entries(groupedPlanificari).map(([groupKey, group], groupIndex) => html`
          <div class="accordion-item mb-3">
            <h2 class="accordion-header" id="heading-${groupIndex}">
              <button class="accordion-button ${groupIndex > 0 ? 'collapsed' : ''}" 
                      type="button" 
                      data-bs-toggle="collapse" 
                      data-bs-target="#collapse-${groupIndex}" 
                      aria-expanded="${groupIndex === 0 ? 'true' : 'false'}" 
                      aria-controls="collapse-${groupIndex}">
                <div class="d-flex justify-content-between w-100">
                  <span><strong>Responsabil planificare:</strong> ${group.responsabilName}</span>
                  <span><strong>Responsabil execuție:</strong> ${group.executantName}</span>
                </div>
              </button>
            </h2>
            <div id="collapse-${groupIndex}" 
                class="accordion-collapse collapse ${groupIndex === 0 ? 'show' : ''}" 
                aria-labelledby="heading-${groupIndex}">
              <div class="accordion-body p-0">
                ${group.items.map(planificare => this.renderPlanificare(planificare, groupIndex))}
              </div>
            </div>
          </div>
        `)}
      </div>
    `
  }

  groupPlanificariByResponsabili() {
    const groups = {}
    
    this.planificari.forEach(p => {
      const groupKey = `${p.RESPPLAN}:${p.RESPEXEC}`
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          responsabil: p.RESPPLAN,
          responsabilName: p.RESPPLAN_NAME || 'Necunoscut',
          executant: p.RESPEXEC,
          executantName: p.RESPEXEC_NAME || 'Necunoscut',
          items: []
        }
      }
      
      groups[groupKey].items.push(p)
    })
    
    return groups
  }

  renderPlanificare(planificare, groupIndex) {
    return html`
      <div class="planificare-container">
        <div class="planificare-header d-flex justify-content-between align-items-center p-2 border-bottom bg-light">
          <div class="d-flex flex-wrap gap-3">
            ${Object.entries(listaPlanificariMask)
              .filter(([_, props]) => props.visible)
              .map(([key, props]) => html`
                <div class="d-flex align-items-center gap-1">
                  <span class="text-muted small">${props.label}:</span>
                  ${key === 'LOCKED' 
                    ? html`<i class="bi ${planificare[key] ? 'bi-lock-fill text-danger' : 'bi-unlock text-success'}"></i>`
                    : props.type === 'datetime'
                      ? html`<span class="fw-bold">${new Date(planificare[key]).toLocaleDateString()}</span>`
                      : html`<span class="fw-bold">${planificare[key]}</span>`
                  }
                </div>
              `)}
          </div>
          <button type="button" class="btn btn-sm btn-outline-primary" 
            @click="${() => this.openPlanificare(planificare.CCCPLANIFICARI, tables.tablePlanificareCurenta.element)}">
            <i class="bi bi-arrows-fullscreen"></i> Extinde
          </button>
        </div>
        
        <litwc-planificare
          id="planificare-${planificare.CCCPLANIFICARI}-${groupIndex}"
          .hasMainHeader=${true}
          .hasSubHeader=${false}
          .canAddInLine=${true}
          .mainMask=${planificareDisplayMask}
          .subsMask=${planificareSubsDisplayMask}
          .data=${planificare.processedDetails || []}
        ></litwc-planificare>
      </div>
    `
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari

