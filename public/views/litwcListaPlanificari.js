import { LitElement, html, contextOferta } from '../client.js'
import { runSQLTransaction, getValFromS1Query } from '../utils/S1.js'
import { _cantitate_planificari } from '../utils/_cantitate_oferta.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { planificareDisplayMask, planificareSubsDisplayMask } from './masks.js'

/* global bootstrap */

export let ds_planificareNoua = []

class LitwcListaPlanificari extends LitElement {
  createRenderRoot() {
    return this
  }

  properties = {
    angajati: { type: Array }
  }

  constructor() {
    super()
    this.angajati = contextOferta.angajati
  }

  connectedCallback() {
    super.connectedCallback()
    this.addEventListener('click', (e) => {
      if (e.target.id === 'adaugaPlanificare') {
        this.handleAddPlanificare()
      }
    })
    if (!this.angajati || this.angajati.length === 0) {
      const intervalId = setInterval(() => {
        if (contextOferta.angajati && contextOferta.angajati.length > 0) {
          this.angajati = contextOferta.angajati
          this.requestUpdate()
          clearInterval(intervalId)
        }
      }, 500)
    }
  }

  render() {
    return html`
      <button type="button" class="btn btn-primary m-2" id="adaugaPlanificare">Adauga planificare</button>

      <!-- Modal -->
      <div
        class="modal fade"
        id="planificareModal"
        tabindex="-1"
        aria-labelledby="planificareModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
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
              <button type="button" class="btn btn-primary" id="btnPlanificareNoua">Planificare noua</button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  handleAddPlanificare() {
    console.log('Adauga planificare button clicked')
    //update angajati
    this.angajati = contextOferta.angajati
    console.log(this.angajati)
    const modal = new bootstrap.Modal(document.getElementById('planificareModal'))
    modal.show()
  }

  firstUpdated() {
    document.getElementById('btnPlanificareNoua').addEventListener('click', () => {
      tables.hideAllBut([tables.tablePlanificareCurenta])
      const ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
      ds_planificareNoua.forEach((parent) => {
        parent.object[_cantitate_planificari] = 0
        if (parent.children) {
          parent.children.forEach((child) => {
            child.object[_cantitate_planificari] = 0
          })
        }
      })
      tables.my_table8.element.hasMainHeader = true
      tables.my_table8.element.hasSubHeader = true
      tables.my_table8.element.canAddInLine = true
      tables.tablePlanificareCurenta.mainMask = planificareDisplayMask
      tables.tablePlanificareCurenta.subMask = planificareSubsDisplayMask
      tables.tablePlanificareCurenta.tables.tablePlanificareCurenta.data = ds_planificareNoua
    })
  }
}

export default LitwcListaPlanificari

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)
