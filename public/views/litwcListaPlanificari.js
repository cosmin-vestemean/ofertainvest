import { LitElement, html, contextOferta } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { planificareDisplayMask, planificareSubsDisplayMask } from './masks.js'
import { employeesService } from '../utils/employeesService.js'

/* global bootstrap */

export let ds_planificareNoua = []

class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    isLoading: { type: Boolean }
  }

  constructor() {
    super()
    this.angajati = []
    this.isLoading = true
    this.modal = null
  }

  createRenderRoot() {
    return this
  }

  async connectedCallback() {
    super.connectedCallback()
    await this.loadEmployees()
    this.setupEventListeners()
  }

  setupEventListeners() {
    this.addEventListener('click', (e) => {
      if (e.target.id === 'adaugaPlanificare') {
        this.showPlanificareModal()
      }
    })
  }

  async loadEmployees() {
    try {
      this.isLoading = true
      this.angajati = await employeesService.loadEmployees()
    } catch (error) {
      console.error('Failed to load employees:', error)
      this.angajati = []
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
      hasSubHeader: true,
      canAddInLine: true,
      mainMask: planificareDisplayMask,
      subMask: planificareSubsDisplayMask,
      data: ds_planificareNoua
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
      <button type="button" class="btn btn-primary m-2" id="adaugaPlanificare">
        Adauga planificare
      </button>
      ${this.renderModal()}
    `
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
