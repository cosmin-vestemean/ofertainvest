import { LitElement, html } from '../client.js'
import { PlanificariController } from '../controllers/PlanificariController.js'
import {
  planificareDisplayMask,
  planificareSubsDisplayMask,
  planificareHeaderMask,
  listaPlanificariMask
} from './masks.js'

/* global bootstrap */

class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    isLoading: { type: Boolean },
    planificari: { type: Array },
    processedPlanificari: { type: Object }
  }

  constructor() {
    super()
    this.controller = new PlanificariController(this)
    
    // Add CSS if needed
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

  async firstUpdated() {
    await this.controller.initialize()
  }

  getFormValue(id) {
    return this.querySelector(`#${id}`).value
  }

  // Keep UI-specific methods
  showToast(message, type = 'info') {
    // Wait for DOM to be ready
    requestAnimationFrame(() => {
      let toastContainer = this.querySelector('#toast-container')

      // Create toast container if it doesn't exist
      if (!toastContainer) {
        toastContainer = document.createElement('div')
        toastContainer.id = 'toast-container'
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3'
        this.appendChild(toastContainer)
      }

      const toastEl = document.createElement('div')
      toastEl.className = `toast align-items-center text-white bg-${type} border-0`
      toastEl.setAttribute('role', 'alert')
      toastEl.setAttribute('aria-live', 'assertive')
      toastEl.setAttribute('aria-atomic', 'true')

      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `

      toastContainer.appendChild(toastEl)
      const toast = new bootstrap.Toast(toastEl)
      toast.show()

      // Remove toast after it's hidden
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove())
    })
  }

  render() {
    if (this.controller.isLoading) {
      return html`<div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>`
    }

    return html`
      <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>
      ${this.renderToolbar()}
      ${this.renderPlanificariStack()}
      ${this.renderModal()}
    `
  }

  renderToolbar() {
    return html`
      <div class="toolbar d-flex align-items-center mb-3 p-2 bg-light border rounded shadow-sm">
        <div class="btn-group me-auto" role="group" aria-label="Basic actions">
          <button type="button" class="btn btn-primary btn-sm" id="adaugaPlanificare" title="Adaugă planificare nouă">
            <i class="bi bi-plus-lg me-1"></i> Adaugă planificare
          </button>
        </div>
        
        <div class="btn-group me-2" role="group" aria-label="Data operations">
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="${() => this.controller.loadPlanificari()}" title="Reîncarcă din cache">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
          <button type="button" class="btn btn-outline-warning btn-sm" @click="${() => this.controller.loadPlanificari(true)}" title="Reîncarcă din baza de date">
            <i class="bi bi-cloud-download"></i> Force Refresh
          </button>
        </div>
        
        <div class="btn-group" role="group" aria-label="Display options">
          <button type="button" class="btn btn-outline-info btn-sm" @click="${() => this.controller.toggleAllSubarticles()}" title="Expandează sau restrânge toate secțiunile">
            <i class="bi bi-arrows-expand"></i> Expand/Collapse
          </button>
        </div>
      </div>
    `
  }

  renderPlanificariStack() {
    return html`
      <div class="planificari-stack">
        ${this.controller.planificari.map(
      (item, index) => html`
            <div class="planificare-card">
              <div class="card-header">
                <div class="card-header-content">
                  <div class="header-item">
                    <span class="text-info mx-2">#${index + 1}</span>
                  </div>
                  ${Object.entries(this.listaPlanificariMask)
          .filter(([_, props]) => props.visible)
          .map(
            ([key, props]) => html`
                        <div class="header-item">
                          <span class="text-muted">${props.label}:</span>
                          <span class="text-info">${item[key]}</span>
                        </div>
                      `
          )}
                </div>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm m-1"
                  @click="${() =>
          this.controller.openPlanificare(item.CCCPLANIFICARI, tables.tablePlanificareCurenta.element)}"
                >
                  <i class="bi bi-arrows-fullscreen"></i>
                </button>
              </div>
              ${this.renderPlanificareDetails(item)}
            </div>
          `
    )}
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
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" id="showDates" @change="${(e) => {
        const dateFields = this.querySelector('.date-fields');
        dateFields.style.display = e.target.checked ? 'block' : 'none';
      }}">
                  <label class="form-check-label" for="showDates">Include date</label>
                </div>
                
                <div class="date-fields" style="display: none">
                  <div class="mb-3">
                    <label for="startDate" class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="startDate" />
                  </div>
                  <div class="mb-3">
                    <label for="endDate" class="form-label">End Date</label>
                    <input type="date" class="form-control" id="endDate" />
                  </div>
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
    const header = this.controller.planificari.find((p) => p.CCCPLANIFICARI === item.CCCPLANIFICARI)
    if (!header) return null

    // Use the pre-processed data
    const planificareData = this.controller.processedPlanificari[item.CCCPLANIFICARI] || []

    return html`
      <div class="card-body">
        <litwc-planificare
          id="planificare-${item.CCCPLANIFICARI}"
          .hasMainHeader=${true}
          .hasSubHeader=${false}
          .canAddInLine=${true}
          .mainMask=${this.planificareDisplayMask}
          .subsMask=${this.planificareSubsDisplayMask}
          .data=${planificareData}
        ></litwc-planificare>
      </div>
    `
  }

  renderEmployeeSelect(id, label) {
    return html`
      <div class="mb-3">
        <label for="${id}" class="form-label">${label}</label>
        <select class="form-select" id="${id}">
          ${this.controller.angajati.map((angajat) => html`<option value="${angajat.PRSN}">${angajat.NAME2}</option>`)}
        </select>
      </div>
    `
  }

  // Make masks available to controller
  get planificareDisplayMask() { return planificareDisplayMask }
  get planificareSubsDisplayMask() { return planificareSubsDisplayMask }
  get planificareHeaderMask() { return planificareHeaderMask }
  get listaPlanificariMask() { return listaPlanificariMask }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
