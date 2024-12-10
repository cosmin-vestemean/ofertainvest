import { LitElement, html} from '../client.js'
import UI1 from './UI1.js'

class MyTableListaRetete extends UI1 {
  constructor() {
    super()
    // Constructorul clasei MyTableListaRetete
  }

  // Suprascrie metodele din UI1 sau adaugă metode noi
  actionsBar(item) {
    return html`
      <div class="actions-bar row">
        <div class="dropdown col">
          <button
            class="btn btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-plus-square text-primary"></i> Adauga articol
          </button>
          <ul class="dropdown-menu">
            ${this.dropdownItems.map(
              (dropdownItem) =>
                html`<li>
                  <a class="dropdown-item" href="#" @click="${() => this.addSub(item)}">${dropdownItem}</a>
                </li>`
            )}
          </ul>
        </div>
        <div class="col">
          <button type="button" class="btn btn-sm" @click="${() => this.saveArticle(item)}">
            <i class="bi bi-save text-info"></i> Salveaza
          </button>
        </div>
        <div class="col">
          <input type="checkbox" id="checkboxConfirmare" name="checkboxConfirmare" />
          <label for="checkboxConfirmare">Finalizata</label>
        </div>
        <div class="col">
          <button type="button" class="btn btn-sm" @click="${() => this.recalculate()}">
            <i class="bi bi-calculator text-info"></i> Recalculeaza
          </button>
        </div>
      </div>
    `
  }

  recalculate() {
    console.log('Recalculeaza button clicked')
    // Implement recalculation logic here
  }
}

export default MyTableListaRetete

customElements.define('my-table-lista-retete', MyTableListaRetete)
