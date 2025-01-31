import { LitElement, html, contextOferta, client } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { planificareDisplayMask, planificareSubsDisplayMask, planificareHeaderMask } from './masks.js'
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
    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT p.*, 
            u1.NAME2 as RESPPLAN_NAME, 
            u2.NAME2 as RESPEXEC_NAME
            FROM CCCPLANIFICARI p
            LEFT JOIN S1.dbo.PRSN u1 ON u1.PRSN = p.RESPPLAN
            LEFT JOIN S1.dbo.PRSN u2 ON u2.PRSN = p.RESPEXEC 
            WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
            ORDER BY p.INSDATE DESC`
        }
      })

      if (!response.success) {
        console.error('Failed to load planificari', response.error)
        return
      }

      this.planificari = response.data
      this.renderPlanificari()
    } catch (error) {
      console.error('Error loading planificari:', error)
    }
  }

  async openPlanificare(id) {
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

      const headerResponse = await client.service('getDataset').find({
        query: {
          sqlQuery: `SELECT * FROM CCCPLANIFICARI WHERE CCCPLANIFICARI = ${id}`
        }
      })

      if (!headerResponse.success || !headerResponse.data?.[0]) {
        console.error('Failed to load planificare header')
        return
      }

      const header = headerResponse.data[0]
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
          id: header.CCCPLANIFICARI
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
    this.ds = this.planificari.map(p => {
      const filtered = {}
      Object.keys(planificareHeaderMask).forEach(key => {
        if (planificareHeaderMask[key].visible) {
          filtered[key] = p[key]
        }
      })
      filtered.RESPPLAN_NAME = p.RESPPLAN_NAME
      filtered.RESPEXEC_NAME = p.RESPEXEC_NAME
      filtered.CCCPLANIFICARI = p.CCCPLANIFICARI
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

    ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
    ds_planificareNoua.forEach(parent => {
      parent.content.forEach(item => {
        item.object[_cantitate_planificari] = 0
        item.children?.forEach(child => {
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
          ${this.angajati.map(angajat => 
            html`<option value="${angajat.PRSN}">${angajat.NAME2}</option>`
          )}
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
        <button type="button" class="btn btn-primary me-2" id="adaugaPlanificare">
          Adauga planificare
        </button>
        <button type="button" class="btn btn-secondary me-2" @click="${() => this.loadPlanificari()}">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      <table class="table table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>Denumire</th>
            <th>Start</th>
            <th>Stop</th>
            <th>Resp. planificare</th>
            <th>Resp. executie</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${this.ds.map((item, index) => html`
            <tr @click="${() => this.openPlanificare(item.CCCPLANIFICARI)}" style="cursor: pointer">
              <td>${index + 1}</td>
              <td>${item.NAME}</td>
              <td>${new Date(item.DATASTART).toLocaleDateString()}</td>
              <td>${new Date(item.DATASTOP).toLocaleDateString()}</td>
              <td>${item.RESPPLAN_NAME}</td>
              <td>${item.RESPEXEC_NAME}</td>
              <td>
                <i class="bi ${item.LOCKED ? 'bi-lock-fill text-danger' : 'bi-unlock text-success'}"></i>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
      ${this.renderModal()}
    `
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
