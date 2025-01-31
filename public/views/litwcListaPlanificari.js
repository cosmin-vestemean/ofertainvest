import { LitElement, html, contextOferta, client } from '../client.js'
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

/* global bootstrap */

export let ds_planificareNoua = []

class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    planificari: { type: Array },
    isLoading: { type: Boolean },
    selectedItems: { type: Array }
  }

  constructor() {
    super()
    this.angajati = []
    this.planificari = []
    this.isLoading = true
    this.modal = null
    this.selectedItems = []
  }

  createRenderRoot() {
    return this
  }

  async loadPlanificari() {
    const query = `
      SELECT p.*, emp1.NAME2 as RESPPLAN_NUME, emp2.NAME2 as RESPEXEC_NUME 
      FROM CCCPLANIFICARI p
      LEFT JOIN PRSN emp1 ON p.RESPPLAN = emp1.PRSN
      LEFT JOIN PRSN emp2 ON p.RESPEXEC = emp2.PRSN
      WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
    `
    const result = await client.service('getDataset').find({
      query: { sqlQuery: query }
    })
    if (result.success) {
      this.planificari = result.data
      this.setupTable()
    } else {
      console.error('Error loading planificari:', result.error)
    }
  }

  setupTable() {
    // Configure this element as a table
    this.innerHTML = this.generateTableContent()

    // Add click handlers for rows
    this.querySelectorAll('tr[data-id]').forEach((row) => {
      row.addEventListener('click', () => {
        if (row.dataset.id) {
          this.openPlanificare(row.dataset.id)
        }
      })
    })
  }

  generateTableContent() {
    const headers = Object.values(listaPlanificariMask)
      .filter((col) => col.visible)
      .map((col) => `<th>${col.label}</th>`)
      .join('')

    const rows = this.planificari
      .map((plan) => {
        const cells = Object.entries(listaPlanificariMask)
          .filter(([, col]) => col.visible)
          .map(([key]) => `<td>${plan[key]}</td>`)
          .join('')
        return `<tr data-id="${plan.ID}">${cells}</tr>`
      })
      .join('')

    return `
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    `
  }

  async openPlanificare(planId) {
    // Load planificare details
    const query = `
      SELECT pl.*, a.* 
      FROM CCCPLANIFICARILINII pl
      JOIN CCCANTEMASURATORI a ON pl.CCCANTEMASURATORI = a.CCCANTEMASURATORI
      WHERE pl.CCCPLANIFICARI = ${planId}
    `
    const result = await client.service('getDataset').find({
      query: { sqlQuery: query }
    })

    if (result.success) {
      const planificare = this.planificari.find((p) => p.CCCPLANIFICARI === parseInt(planId))

      // Structure data for litwc-planificare
      ds_planificareNoua = this.structureDataForPlanificare(result.data)

      // Configure and show table
      const table = tables.tablePlanificareCurenta.element
      Object.assign(table, {
        hasMainHeader: true,
        hasSubHeader: false,
        canAddInLine: true,
        mainMask: planificareDisplayMask,
        subsMask: planificareSubsDisplayMask,
        data: ds_planificareNoua,
        documentHeader: {
          startDate: planificare.DATASTART,
          endDate: planificare.DATASTOP,
          responsabilPlanificare: planificare.RESPPLAN,
          responsabilExecutie: planificare.RESPEX
        },
        documentHeaderMask: planificareHeaderMask
      })

      tables.hideAllBut([tables.tablePlanificareCurenta])
    }
  }

  structureDataForPlanificare(data) {
    // Transform flat data into hierarchical structure matching ds_antemasuratori format
    // Implementation depends on your data structure
    return data
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
      // Load employees if needed
      if (contextOferta?.angajati?.length > 0) {
        this.angajati = contextOferta.angajati
      } else {
        const employees = await employeesService.loadEmployees()
        if (employees?.length > 0) {
          this.angajati = employees
          contextOferta.angajati = employees
        }
      }

      // Load planificari
      await this.loadPlanificari()
      await this.setupTable()

      this.setupEventListeners()
    } catch (error) {
      console.error('Error in initialization:', error)
    } finally {
      this.isLoading = false
      this.requestUpdate()
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

  renderToolbar() {
    return html`
      <div class="btn-toolbar mb-2" role="toolbar">
        <div class="btn-group me-2" role="group">
          <button type="button" class="btn btn-primary" id="adaugaPlanificare">
            <i class="bi bi-plus-lg"></i> Adauga planificare
          </button>
        </div>
        <div class="btn-group me-2" role="group">
          <button
            type="button"
            class="btn btn-danger"
            ?disabled=${this.selectedItems.length === 0}
            @click=${this.deletePlanificari}
          >
            <i class="bi bi-trash"></i> Sterge
          </button>
        </div>
      </div>
    `
  }

  async deletePlanificari() {
    if (!confirm('Sigur doriti sa stergeti planificarile selectate?')) return

    const ids = this.selectedItems.join(',')
    const query = `DELETE FROM CCCPLANIFICARI WHERE ID IN (${ids})`
    // ... implement delete logic using your API ...
    await this.loadPlanificari()
  }

  render() {
    if (this.isLoading) {
      return html`<div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>`
    }

    return html`
      ${this.renderToolbar()}
        ${
          this.planificari.length
            ? html` <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    ${Object.values(listaPlanificariMask)
                      .filter((col) => col.visible)
                      .map((col) => html`<th>${col.label}</th>`)}
                  </tr>
                </thead>
                <tbody>
                  ${this.planificari.map(
                    (plan) => html`
                      <tr
                        data-id="${plan.CCCPLANIFICARI}"
                        @click=${() => this.openPlanificare(plan.CCCPLANIFICARI)}
                      >
                        ${Object.entries(listaPlanificariMask)
                          .filter(([, col]) => col.visible)
                          .map(([key]) => html`<td>${plan[key]}</td>`)}
                      </tr>
                    `
                  )}
                </tbody>
              </table>`
            : html`<div class="alert alert-warning p-3" role="alert">No data.</div>`
        }
        ${this.renderModal()}
      </table>
    `
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
