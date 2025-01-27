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
    angajati: { type: Array }
  }

  createRenderRoot() {
    return this
  }

  constructor() {
    super()
    this.angajati = []
  }

  connectedCallback() {
    super.connectedCallback()
    this.loadEmployees()
    this.addEventListener('click', (e) => {
      if (e.target.id === 'adaugaPlanificare') {
        this.handleAddPlanificare()
      }
    })
  }

  async loadEmployees() {
    this.angajati = await employeesService.loadEmployees()
    this.requestUpdate()
  }

  handlePlanificareNoua() {
    if (!ds_antemasuratori?.length) {
      console.log('ds_antemasuratori is empty')
      return
    }

    tables.hideAllBut([tables.tablePlanificareCurenta])
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
    table.hasMainHeader = true
    table.hasSubHeader = true 
    table.canAddInLine = true
    table.mainMask = planificareDisplayMask
    table.subMask = planificareSubsDisplayMask
    table.data = ds_planificareNoua

    bootstrap.Modal.getInstance(document.getElementById('planificareModal')).hide()
  }

  render() {
    return html`
      <button type="button" class="btn btn-primary m-2" id="adaugaPlanificare">Adauga planificare</button>

      <!-- Modal -->
      <div
        class="modal"
        id="planificareModal"
        tabindex="-1"
        aria-labelledby="planificareModalLabel"
        aria-hidden="true"
      >
        <div role="dialog" class="modal-dialog modal-dialog-scrollable modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="planificareModalLabel">Adauga Planificare</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form>
                <div class="mb-3">
                  <label for="startDate" class="form-label">Start Date</label>
                  <input type="date" class="form-control" id="startDate" />
                </div>
                <div class="mb-3">
                  <label for="endDate" class="form-label">End Date</label>
                  <input type="date" class="form-control" id="endDate" />
                </div>
                <div class="mb-3">
                  <label for="select1" class="form-label">Responsabil planificare</label>
                  <select class="form-select" id="select1">
                    ${this.angajati.map(
                      (angajat) => html`<option value="${angajat.PRSN}">${angajat.NAME2}</option>`
                    )}
                  </select>
                </div>
                <div class="mb-3">
                  <label for="select2" class="form-label">Responsabil executie</label>
                  <select class="form-select" id="select2">
                    ${this.angajati.map(
                      (angajat) => html`<option value="${angajat.PRSN}">${angajat.NAME2}</option>`
                    )}
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button
                type="button"
                class="btn btn-primary"
                id="btnPlanificareNoua"
                @click="${this.handlePlanificareNoua}"
              >
                Planificare noua
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  handleAddPlanificare() {
    console.log('Adauga planificare button clicked')
    new bootstrap.Modal(document.getElementById('planificareModal'), {
      keyboard: true, 
      backdrop: false
    }).show()
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)

export default LitwcListaPlanificari
