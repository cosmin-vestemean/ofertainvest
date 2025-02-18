import { LitElement, html, contextOferta, client } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { ds_antemasuratori, convertDBAntemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import {
  planificareDisplayMask,
  planificareSubsDisplayMask,
  planificareHeaderMask,
  listaPlanificariMask
} from './masks.js'
import { employeesService } from '../utils/employeesService.js'

/* global bootstrap */

//await employeesService.loadEmployees()
//await client.service('getDataset').find({ query: { sqlQuery: ``   } })

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
      this.renderPlanificari()
      return
    }

    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT p.CCCPLANIFICARI, p.CCCOFERTEWEB, 
        p.RESPEXEC, p.RESPPLAN,
        u1.NAME2 as RESPPLAN_NAME, 
        u2.NAME2 as RESPEXEC_NAME,
        l.*, a.*, o.*, c.*
        FROM CCCPLANIFICARI p
        LEFT JOIN PRSN u1 ON u1.PRSN = p.RESPPLAN
        LEFT JOIN PRSN u2 ON u2.PRSN = p.RESPEXEC 
        inner join cccplanificarilinii l on (p.CCCPLANIFICARI = l.CCCPLANIFICARI)
        inner join cccantemasuratori a on (l.CCCANTEMASURATORI = a.CCCANTEMASURATORI and l.CCCOFERTEWEB = a.CCCOFERTEWEB)
        inner join cccoferteweblinii o on (a.CCCOFERTEWEBLINII = o.CCCOFERTEWEBLINII)
        inner join cccpaths c on (c.CCCPATHS = a.CCCPATHS)
        WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
        ORDER BY p.RESPPLAN, p.RESPEXEC`
        }
      })

      if (!response.success) {
        console.error('Failed to load planificari', response.error)
        return
      }

      //extract from response.data distinct respplan, respexec from cccplanificari, add the rest details in a separate object named linii
      // Group by planificare header
      const grouped = response.data.reduce((acc, row) => {
        if (!acc[row.CCCPLANIFICARI]) {
          // Create header entry if it doesn't exist
          acc[row.CCCPLANIFICARI] = {
            CCCPLANIFICARI: row.CCCPLANIFICARI,
            CCCOFERTEWEB: row.CCCOFERTEWEB,
            RESPEXEC: row.RESPEXEC,
            RESPPLAN: row.RESPPLAN,
            RESPPLAN_NAME: row.RESPPLAN_NAME,
            RESPEXEC_NAME: row.RESPEXEC_NAME,
            linii: [] // Store detail rows here
          }
        }

        // Add detail row if it exists
        if (row.CCCANTEMASURATORI) {
          acc[row.CCCPLANIFICARI].linii.push({ ...row })
        }

        return acc
      }, {})

      // Convert to array
      this.planificari = Object.values(grouped)

      console.info('Loaded planificari:', this.planificari)
      this.renderPlanificari()
    } catch (error) {
      console.error('Error loading planificari:', error)
      this.planificari = []
      this.ds = []
      this.renderPlanificari()
    }
  }

  async openPlanificare(id, table, hideAllBut = true) {
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

      const header = this.planificari.find((p) => p.CCCPLANIFICARI === id)
      if (!header) {
        console.error('Failed to find planificare header')
        return
      }

      const planificareCurenta = await convertDBAntemasuratori(response.data)

      console.info('Loaded planificare details:', planificareCurenta)

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
      <style>
        .planificari-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }
        .planificare-card {
          border: 1px solid #dee2e6;
          border-radius: 0.25rem;
          background: white;
        }
        .card-header {
          padding: 0.75rem;
          border-bottom: 1px solid #dee2e6;
          background: #f8f9fa;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-body {
          padding: 0;
        }
      </style>

      <div class="toolbar mb-2">
        <button type="button" class="btn btn-primary btn-sm me-2" id="adaugaPlanificare">
          Adauga planificare
        </button>
        <button type="button" class="btn btn-secondary btn-sm me-2" @click="${() => this.loadPlanificari()}">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      <div class="planificari-grid">
        ${this.planificari.map((item, index) => html`
          <div class="planificare-card">
            <div class="card-header">
              <span>Planificare #${index + 1} - ${item.RESPPLAN_NAME || 'N/A'}</span>
              <div>
                <i class="bi ${item.LOCKED ? 'bi-lock-fill text-danger' : 'bi-unlock text-success'}"></i>
              </div>
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
                .documentHeader=${{
                  responsabilPlanificare: item.RESPPLAN,
                  responsabilExecutie: item.RESPEXEC,
                  id: item.CCCPLANIFICARI
                }}
                .documentHeaderMask=${planificareHeaderMask}
              ></litwc-planificare>
            </div>
          </div>
        `)}
      </div>
      ${this.renderModal()}
    `
  }

  async updatePlanificareData(header) {
    try {
      const convertedData = await convertDBAntemasuratori(header.linii || [])
      const element = this.querySelector(`#planificare-${header.CCCPLANIFICARI}`)
      if (element) {
        element.data = convertedData
      }
    } catch (error) {
      console.error('Error converting planificare data:', error)
    }
  }

  firstUpdated() {
    // ...existing firstUpdated code...
    
    // Update all planificari data after loading
    this.planificari.forEach(header => {
      this.updatePlanificareData(header)
    })
  }
}
customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
