import { LitElement, html, contextOferta, client } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { planificareDisplayMask, planificareSubsDisplayMask, planificareHeaderMask, listaPlanificariMask } from './masks.js'
import { employeesService } from '../utils/employeesService.js'

export let ds_planificareNoua = []

class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    planificari: { type: Array },
    isLoading: { type: Boolean },
    selectedItems: { type: Array },
    errorMessage: { type: String }
  }

  constructor() {
    super()
    this.angajati = []
    this.planificari = []
    this.isLoading = true
    this.modal = null
    this.selectedItems = []
    this.initialized = false
  }

  createRenderRoot() {
    return this
  }

  // Data loading and initialization
  async updated(changedProperties) {
    if (contextOferta.CCCOFERTEWEB && !this.initialized) {
      await this._initializeComponent()
    }
  }

  async _initializeComponent() {
    this.isLoading = true
    this.initialized = true
    
    try {
      await this._loadEmployees()
      await this._loadPlanificari()
    } catch (error) {
      this.errorMessage = 'Failed to load data: ' + error.message
      console.error('Error initializing component:', error)
    } finally {
      this.isLoading = false
      this.requestUpdate()
    }
  }

  async _loadEmployees() {
    if (!this.angajati.length) {
      this.angajati = contextOferta.angajati?.length > 0 
        ? contextOferta.angajati
        : await employeesService.loadEmployees() || []
      if (this.angajati.length) {
        contextOferta.angajati = this.angajati
      }
    }
  }

  async _loadPlanificari() {
    if (!contextOferta.CCCOFERTEWEB) {
      throw new Error('Invalid CCCOFERTEWEB')
    }

    const query = `
      SELECT p.*, emp1.NAME2 as RESPPLAN_NUME, emp2.NAME2 as RESPEXEC_NUME 
      FROM CCCPLANIFICARI p
      LEFT JOIN PRSN emp1 ON p.RESPPLAN = emp1.PRSN
      LEFT JOIN PRSN emp2 ON p.RESPEXEC = emp2.PRSN
      WHERE p.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
    `

    const result = await client.service('getDataset').find({ query: { sqlQuery: query } })
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to load planificari')
    }

    this.planificari = result.data
  }

  // Event handlers
  async _handleAddPlanificare() {
    if (!this.validateDates()) return
    
    try {
      await this._createNewPlanificare()
      this.modal?.hide()
    } catch (error) {
      console.error('Error creating planificare:', error)
      alert('Failed to create planificare')
    }
  }

  async _handleDeletePlanificari() {
    if (!confirm('Sigur doriti sa stergeti planificarile selectate?')) return
    
    try {
      const ids = this.selectedItems.join(',')
      await client.service('runSQLTransaction').create({
        sqlList: [`DELETE FROM CCCPLANIFICARI WHERE ID IN (${ids})`]
      })
      await this._loadPlanificari()
    } catch (error) {
      console.error('Error deleting planificari:', error)
      alert('Failed to delete planificari')
    }
  }

  // UI Components
  _renderTable() {
    if (!this.planificari.length) {
      return html`<div class="alert alert-info">No planificari found</div>`
    }

    return html`
      <table class="table table-hover">
        <thead>
          <tr>
            ${Object.values(listaPlanificariMask)
              .filter(col => col.visible)
              .map(col => html`<th>${col.label}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${this.planificari.map(plan => this._renderTableRow(plan))}
        </tbody>
      </table>
    `
  }

  _renderTableRow(plan) {
    return html`
      <tr data-id="${plan.CCCPLANIFICARI}" @click=${() => this._openPlanificare(plan.CCCPLANIFICARI)}>
        ${Object.entries(listaPlanificariMask)
          .filter(([,col]) => col.visible)
          .map(([key]) => html`<td>${plan[key]}</td>`)}
      </tr>
    `
  }

  // ...existing modal rendering code...

  render() {
    if (this.isLoading) {
      return html`<div class="spinner-border text-primary" role="status"></div>`
    }

    if (this.errorMessage) {
      return html`<div class="alert alert-danger">${this.errorMessage}</div>`
    }

    return html`
      ${this._renderToolbar()}
      ${this._renderTable()}
      ${this._renderModal()}
    `
  }

  // Helper methods for planificare operations
  async _openPlanificare(planId) {
    try {
      const data = await this._loadPlanificareDetails(planId)
      const planificare = this.planificari.find(p => p.CCCPLANIFICARI === parseInt(planId))
      
      this._configurePlanificareTable(data, planificare)
      tables.hideAllBut([tables.tablePlanificareCurenta])
    } catch (error) {
      console.error('Error opening planificare:', error)
      alert('Failed to open planificare')
    }
  }

  async _loadPlanificareDetails(planId) {
    const query = `
      SELECT pl.*, a.* 
      FROM CCCPLANIFICARILINII pl
      JOIN CCCANTEMASURATORI a ON pl.CCCANTEMASURATORI = a.CCCANTEMASURATORI
      WHERE pl.CCCPLANIFICARI = ${planId}
    `
    const result = await client.service('getDataset').find({ query: { sqlQuery: query } })
    if (!result.success) throw new Error(result.error)
    return result.data
  }

  _configurePlanificareTable(data, planificare) {
    ds_planificareNoua = this._structureDataForPlanificare(data)
    
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
        responsabilExecutie: planificare.RESPEXEC
      },
      documentHeaderMask: planificareHeaderMask
    })
  }

  // ...existing validation and utility methods...
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)
