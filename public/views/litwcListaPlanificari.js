import { LitElement, html, unsafeHTML, contextOferta } from '../client.js'

/* global bootstrap */

class LitwcListaPlanificari extends LitElement {
  createRenderRoot() {
    return this
  }
  render() {
    return html`
      <button @click="${this.handleAddPlanificare}">Adauga planificare</button>

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
                    ${unsafeHTML(
                      contextOferta.angajati
                        .map((angajat) => `<option value="${angajat.PRSN}">${angajat.NAME2}</option>`)
                        .join('')
                    )}
                  </select>
                </div>
                <div class="mb-3">
                  <label for="select2" class="form-label">Responsabil executie</label>
                  <select class="form-select" id="select2">
                    ${unsafeHTML(
                      contextOferta.angajati
                        .map((angajat) => `<option value="${angajat.PRSN}">${angajat.NAME2}</option>`)
                        .join('')
                    )}
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary">Planificare</button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  handleAddPlanificare() {
    console.log('Adauga planificare button clicked')
    const modal = new bootstrap.Modal(document.getElementById('planificareModal'))
    modal.show()
  }
}

export default LitwcListaPlanificari

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)
