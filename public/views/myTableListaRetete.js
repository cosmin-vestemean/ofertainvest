import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'
import { recipeDisplayMask, recipeSubsDisplayMask } from './masks.js'

class MyTableListaRetete extends LitElement {
  static properties = {
    data: { type: Array }
  }

  static styles = css`
    .hidden {
      display: none;
    }
  `

  constructor() {
    super()
    this.data = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this.articole = []
  }

  visibleDisplayMask = (mask) => {
    let displayMask = {}
    for (let column in mask) {
      if (mask[column].visible) {
        displayMask[column] = mask[column]
      }
    }
    return displayMask
  }

  script1 = () => {
    let script = document.createElement('script')
    script.onload = this.onLoad.bind(this)
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
    script.integrity = 'sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz'
    script.crossOrigin = 'anonymous'
    return script
  }

  script2 = () => {
    let script = document.createElement('script')
    script.onload = this.onLoad.bind(this)
    script.src = 'https://cdn.jsdelivr.net/npm/use-bootstrap-select@2.2.0/dist/use-bootstrap-select.min.js'
    return script
  }

  onLoad() {
    console.log('Script loaded')
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      const visibleRecipeDisplayMask = this.visibleDisplayMask(recipeDisplayMask)
      const visibleRecipeSubsDisplayMask = this.visibleDisplayMask(recipeSubsDisplayMask)

      this.articole = []
      this.data.forEach((reteta) => {
        reteta.reteta.forEach((activitate) => {
          let articol = activitate.object
          let newArticol = {}
          let newSubarticole = []

          for (let key in visibleRecipeDisplayMask) {
            if (Object.keys(articol).includes(key)) {
              newArticol[key] = articol[key]
            }
          }

          let subarticole = activitate.children.map((subarticol) => subarticol.object)
          for (let subarticol of subarticole) {
            let newSubarticol = {}
            for (let key in visibleRecipeSubsDisplayMask) {
              if (Object.keys(subarticol).includes(key)) {
                newSubarticol[key] = subarticol[key]
              }
            }
            newSubarticole.push(newSubarticol)
          }

          this.articole.push({
            articol: newArticol,
            subarticole: newSubarticole
          })
        })
      })

      console.log('articole', this.articole)

      return html`
        <div class="container-fluid">
          <table class="table table-sm is-responsive" style="font-size: small;">
            <thead>
              <tr>
                <th></th>
                ${Object.keys(visibleRecipeDisplayMask).map(
                  (key) => html`<th>${visibleRecipeDisplayMask[key].label || key}</th>`
                )}
              </tr>
            </thead>
            <tbody>
              ${this.articole.map(
                (item, index) => html`
                  <tr data-index="${index}">
                    <td>
                      ${item.subarticole.length > 0
                        ? html`<i
                            class="bi bi-plus-square"
                            style="cursor: pointer;"
                            @click="${() => this.toggleSubarticles(index)}"
                          ></i>`
                        : ''}
                    </td>
                    ${Object.keys(visibleRecipeDisplayMask).map((key) => html`<td contenteditable="${visibleRecipeDisplayMask[key].RW}">${item.articol[key]}</td>`)}
                  </tr>
                  <tr class="subarticle hidden" data-parent-index="${index}">
                    <td colspan="${Object.keys(visibleRecipeDisplayMask).length + 1}">
                      <table class="table table-sm is-responsive" style="font-size: small;">
                        <thead>
                          <tr>
                            <th>
                              <div class="dropdown">
                                <button
                                  class="btn btn-sm btn-secondary dropdown-toggle"
                                  type="button"
                                  id="dropdownMenuButton"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                >
                                  <i class="bi bi-plus-square"></i>
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                  <li>
                                    <a
                                      class="dropdown-item"
                                      href="#"
                                      @click="${() => this.addArticle('Material')}"
                                      >Material</a
                                    >
                                  </li>
                                  <li>
                                    <a
                                      class="dropdown-item"
                                      href="#"
                                      @click="${() => this.addArticle('Manopera')}"
                                      >Manopera</a
                                    >
                                  </li>
                                  <li>
                                    <a
                                      class="dropdown-item"
                                      href="#"
                                      @click="${() => this.addArticle('Transport')}"
                                      >Transport</a
                                    >
                                  </li>
                                  <li>
                                    <a
                                      class="dropdown-item"
                                      href="#"
                                      @click="${() => this.addArticle('Utilaj')}"
                                      >Utilaj</a
                                    >
                                  </li>
                                  <li><hr class="dropdown-divider" /></li>
                                  <li>
                                    <a
                                      class="dropdown-item"
                                      href="#"
                                      @click="${() => this.addArticle('Material + Manopera')}"
                                      >Material + Manopera</a
                                    >
                                  </li>
                                  <li>
                                    <a
                                      class="dropdown-item"
                                      href="#"
                                      @click="${() => this.addArticle('Material + Transport')}"
                                      >Material + Transport</a
                                    >
                                  </li>
                                  <li>
                                    <a
                                      class="dropdown-item"
                                      href="#"
                                      @click="${() => this.addArticle('Material + Utilaj')}"
                                      >Material + Utilaj</a
                                    >
                                  </li>
                                </ul>
                              </div>
                            </th>
                            ${Object.keys(visibleRecipeSubsDisplayMask).map(
                              (key) => html` <th>${visibleRecipeSubsDisplayMask[key].label || key}</th> `
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          ${item.subarticole.map(
                            (sub) => html`
                              <tr>
                                <td></td>
                                ${Object.keys(visibleRecipeSubsDisplayMask).map(
                                  (key) => html`
                                    <td style="width: 3%;"></td>
                                    <td contenteditable="${visibleRecipeSubsDisplayMask[key].RW}">${sub[key]}</td>
                                  `
                                )}
                              </tr>
                            `
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                `
              )}
            </tbody>
          </table>
          ${this.script1()}
          ${this.script2()}
        </div>
      `
    }
  }

  toggleSubarticles(index) {
    const row = this.shadowRoot.querySelector(`tr[data-parent-index="${index}"]`)
    row.classList.toggle('hidden')
    // Toggle the icon
    const toggleIcon = this.shadowRoot.querySelector(`tr[data-index="${index}"] i`)
    if (toggleIcon.classList.contains('bi-plus-square')) {
      toggleIcon.classList.remove('bi-plus-square')
      toggleIcon.classList.add('bi-dash-square')
    } else {
      toggleIcon.classList.remove('bi-dash-square')
      toggleIcon.classList.add('bi-plus-square')
    }
  }

  addArticle(type) {
    // Logic to add more articles manually based on the type
    console.log('Add article clicked:', type)
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
