import { LitElement, html, contextOferta, client } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { ds_antemasuratori, convertDBAntemasuratori } from '../controllers/antemasuratori.js'
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
      return
    }

    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `
            WITH PlanificariFull AS (
              SELECT 
                p.CCCPLANIFICARI, p.CCCOFERTEWEB,
                p.RESPEXEC, p.RESPPLAN,
                p.NAME as PLANIFICARE_NAME,
                FORMAT(p.DATASTART, 'yyyy-MM-dd') as DATASTART,
                FORMAT(p.DATASTOP, 'yyyy-MM-dd') as DATASTOP,
                p.LOCKED,
                FORMAT(p.INSDATE, 'yyyy-MM-dd') as INSDATE,
                FORMAT(p.UPDDATE, 'yyyy-MM-dd') as UPDDATE,
                p.INSUSR, p.UPDUSR,
                u1.NAME2 as RESPPLAN_NAME,
                u2.NAME2 as RESPEXEC_NAME,
                a.*, 
                c.DENUMIRE,
                c.UM,
                l.CANTITATE as ${_cantitate_planificari},
                pa.PATH,
                pa.PATHID
              FROM CCCPLANIFICARI p
              LEFT JOIN PRSN u1 ON u1.PRSN = p.RESPPLAN
              LEFT JOIN PRSN u2 ON u2.PRSN = p.RESPEXEC
              INNER JOIN cccplanificarilinii l on l.CCCPLANIFICARI = p.CCCPLANIFICARI
              INNER JOIN cccantemasuratori a on a.cccantemasuratori = l.cccantemasuratori
              INNER JOIN cccoferteweblinii c on c.CCCOFERTEWEBLINII = a.CCCOFERTEWEBLINII
              INNER JOIN cccpaths pa on pa.CCCPATHS = a.CCCPATHS
              WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
            )
            SELECT * FROM PlanificariFull
            ORDER BY RESPEXEC, DATASTART, PATHID
          `
        }
      })

      if (!response.success) {
        console.error('Failed to load planificari', response.error)
        return
      }

      // Group data by executant and planificare
      const planificariByExecutant = response.data.reduce((acc, row) => {
        const execId = row.RESPEXEC
        const planId = row.CCCPLANIFICARI

        if (!acc[execId]) {
          acc[execId] = {
            executant: {
              PRSN: row.RESPEXEC,
              NAME2: row.RESPEXEC_NAME
            },
            planificari: {}
          }
        }

        if (!acc[execId].planificari[planId]) {
          acc[execId].planificari[planId] = {
            header: {
              id: planId,
              name: row.PLANIFICARE_NAME,
              startDate: row.DATASTART,
              endDate: row.DATASTOP,
              responsabilPlanificare: row.RESPPLAN,
              responsabilExecutie: row.RESPEXEC
            },
            articles: []
          }
        }

        acc[execId].planificari[planId].articles.push(row)
        return acc
      }, {})

      this.planificariByExecutant = planificariByExecutant
      console.info('Loaded and grouped planificari:', planificariByExecutant)
      this.requestUpdate()

    } catch (error) {
      console.error('Error loading planificari:', error)
      this.planificariByExecutant = {}
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
          sqlQuery: `select * from cccplanificarilinii a
            inner join cccantemasuratori b on (a.cccantemasuratori=b.cccantemasuratori and a.cccoferteweb=b.cccoferteweb)
            inner join cccoferteweblinii c on (b.cccoferteweblinii=c.cccoferteweblinii)
            inner join cccpaths d on (d.cccpaths=b.cccpaths)
            WHERE a.CCCPLANIFICARI = ${id}`
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

      const planificareCurenta = await convertDBAntemasuratori(response.data)

      console.info('Loaded planificare details:', planificareCurenta)

      const table = tables.tablePlanificareCurenta.element
      Object.assign(table, {
        hasMainHeader: true,
        hasSubHeader: false,
        canAddInLine: true,
        mainMask: planificareDisplayMask,
        subsMask: planificareSubsDisplayMask,
        data: planificareCurenta,
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

      <div class="planificari-container">
        ${Object.entries(this.planificariByExecutant || {}).map(([execId, data]) => html`
          <div class="executant-section card mb-4">
            <div class="card-header bg-light">
              <h5 class="mb-0">
                <i class="bi bi-person-circle text-primary me-2"></i>
                ${data.executant?.NAME2 || 'Executant necunoscut'}
              </h5>
            </div>
            <div class="card-body">
              ${Object.values(data.planificari).map(planificare => html`
                <litwc-planificare 
                  .data=${planificare.articles}
                  .documentHeader=${planificare.header}
                ></litwc-planificare>
              `)}
            </div>
          </div>
        `)}
      </div>

      ${this.renderModal()}
    `
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
