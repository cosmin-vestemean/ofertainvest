import { LitElement, html, contextOferta, client } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { planificareDisplayMask, planificareSubsDisplayMask, planificareHeaderMask, listaPlanificariMask } from './masks.js'
import { employeesService } from '../utils/employeesService.js'

/* global bootstrap */

export let ds_planificareNoua = []

class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    isLoading: { type: Boolean },
    planificari: { type: Array },
    ds: { type: Array },
    groupedPlanificari: { type: Object }, // New property
    selectedArticles: { type: Array }     // New property
  }

  constructor() {
    super()
    this.angajati = [] // Initialize empty array
    this.isLoading = true
    this.modal = null
    this.planificari = []
    this.ds = []
    this.groupedPlanificari = {}
    this.selectedArticles = []
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
      console.warn('No valid CCCOFERTEWEB found')
      this.planificari = []
      this.ds = []
      this.renderPlanificari()
      return
    }

    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT p.CCCPLANIFICARI, p.CCCOFERTEWEB, 
        p.RESPEXEC, p.RESPPLAN,
        p.NAME, 
        FORMAT(p.DATASTART, 'yyyy-MM-dd') as DATASTART, 
        FORMAT(p.DATASTOP, 'yyyy-MM-dd') as DATASTOP,
        p.LOCKED, 
        FORMAT(p.INSDATE, 'yyyy-MM-dd') as INSDATE,
        FORMAT(p.UPDDATE, 'yyyy-MM-dd') as UPDDATE,
        p.INSUSR, p.UPDUSR,
        u1.NAME2 as RESPPLAN_NAME, 
        u2.NAME2 as RESPEXEC_NAME
        FROM CCCPLANIFICARI p
        LEFT JOIN PRSN u1 ON u1.PRSN = p.RESPPLAN
        LEFT JOIN PRSN u2 ON u2.PRSN = p.RESPEXEC 
        WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
        ORDER BY p.INSDATE DESC`
        }
      })

      if (!response.success) {
        console.error('Failed to load planificari', response.error)
        return
      }

      this.planificari = response.data
      console.info('Loaded planificari:', this.planificari)

      // Group planificari by executant
      this.groupedPlanificari = this.planificari.reduce((groups, plan) => {
        const execId = plan.RESPEXEC
        if (!groups[execId]) {
          groups[execId] = {
            executant: this.angajati.find(a => a.PRSN === execId),
            planificari: []
          }
        }
        groups[execId].planificari.push(plan)
        return groups
      }, {})

      this.requestUpdate()
      this.renderPlanificari()
    } catch (error) {
      console.error('Error loading planificari:', error)
      this.planificari = []
      this.ds = []
      this.renderPlanificari()
    }
  }

  async openPlanificare(id) {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found') 
      return
    }

    console.info('Opening planificare:', id)

    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT pl.*, a.* 
            FROM CCCPLANIFICARILINII pl
            INNER JOIN CCCANTEMASURATORI a ON a.CCCANTEMASURATORI = pl.CCCANTEMASURATORI 
            WHERE pl.CCCPLANIFICARI = ${id}`
        }
      })

      if (!response.success) {
        console.error('Failed to load planificare details', response.error) 
        return
      }

      const header = this.planificari.find(p => p.CCCPLANIFICARI === id)
      if (!header) {
        console.error('Failed to find planificare header')
        return
      }

      const table = tables.tablePlanificareCurenta.element
      Object.assign(table, {
        hasMainHeader: true,
        hasSubHeader: false,
        canAddInLine: true,
        mainMask: planificareDisplayMask,
        subsMask: planificareSubsDisplayMask,
        data: response.data,
        documentHeader: {
          startDate: header.DATASTART,
          endDate: header.DATASTOP,
          responsabilPlanificare: header.RESPPLAN,
          responsabilExecutie: header.RESPEXEC,
          id: header.CCCPLANIFICARI,
          name: header.NAME
        },
        documentHeaderMask: planificareHeaderMask
      })

      tables.hideAllBut([tables.tablePlanificareCurenta])

    } catch (error) {
      console.error('Error loading planificare details:', error)
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
              <h5 class="modal-title">Adauga Planificare</h5>
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

  async scheduleBulkArticles(articles, executantId, startDate, endDate) {
    // Validate dates
    if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
      alert('Invalid date range')
      return
    }

    // Create new planificare
    const planificare = {
      RESPEXEC: executantId,
      DATASTART: startDate,
      DATASTOP: endDate,
      NAME: `Planificare ${new Date().toLocaleDateString()}`,
      articles: articles
    }

    try {
      // Save to database
      const result = await this.savePlanificare(planificare)
      if (result.success) {
        await this.loadPlanificari() // Refresh list
        this.selectedArticles = [] // Clear selection
      }
    } catch (error) {
      console.error('Failed to schedule articles:', error)
      alert('Failed to schedule articles')
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
      <button type="button" class="btn btn-primary btn-sm me-2" id="adaugaPlanificare">Adauga planificare</button>
      <button type="button" class="btn btn-secondary btn-sm me-2" @click="${() => this.loadPlanificari()}">
        <i class="bi bi-arrow-clockwise"></i> Refresh
      </button>
      </div>

      <div class="planificari-container">
        ${Object.entries(this.groupedPlanificari).map(([execId, data]) => html`
          <div class="executant-group card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">${data.executant?.NAME2 || 'Unknown'}</h6>
              <button class="btn btn-sm btn-primary" 
                      @click=${() => this.showScheduleModal(execId)}>
                <i class="bi bi-calendar-plus"></i> Programeaza
              </button>
            </div>
            <div class="card-body">
              ${this.renderPlanificariTimeline(data.planificari)}
            </div>
            <div class="card-footer">
              ${this.renderArticleList(data.planificari)}
            </div>
          </div>
        `)}
      </div>

      ${this.renderModal()}
    `
  }

  renderPlanificariTimeline(planificari) {
    // Implement timeline visualization
    return html`
      <div class="timeline">
        ${planificari.map(p => html`
          <div class="timeline-item">
            <div class="timeline-date">
              ${new Date(p.DATASTART).toLocaleDateString()} - 
              ${new Date(p.DATASTOP).toLocaleDateString()}
            </div>
            <div class="timeline-content">
              ${p.NAME}
            </div>
          </div>
        `)}
      </div>
    `
  }

  renderArticleList(planificari) {
    // Get all articles from planificari
    const articles = planificari.flatMap(p => {
      if (p.ARTICLES) {
        return p.ARTICLES.map(article => ({
          ...article,
          planificare: p
        }))
      }
      return []
    })

    return html`
      <div class="article-list">
        ${articles.map(article => html`
          <div class="article-item ${this.selectedArticles.includes(article.ID) ? 'selected' : ''}"
               @click="${() => this.toggleArticleSelection(article.ID)}"
               draggable="true"
               @dragstart="${(e) => this.handleDragStart(e, article)}"
          >
            <div class="article-header">
              <small class="text-muted">${article.planificare.NAME}</small>
            </div>
            <div class="article-content">
              ${article.NAME || 'Untitled'}
              ${article[_cantitate_planificari] ? html`
                <span class="badge bg-secondary">${article[_cantitate_planificari]}</span>
              ` : ''}
            </div>
          </div>
        `)}
      </div>
    `
  }

  toggleArticleSelection(articleId) {
    if (this.selectedArticles.includes(articleId)) {
      this.selectedArticles = this.selectedArticles.filter(id => id !== articleId)
    } else {
      this.selectedArticles = [...this.selectedArticles, articleId]
    }
    this.requestUpdate()
  }

  handleDragStart(e, article) {
    e.dataTransfer.setData('text/plain', JSON.stringify(article))
    e.dataTransfer.effectAllowed = 'move'
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
