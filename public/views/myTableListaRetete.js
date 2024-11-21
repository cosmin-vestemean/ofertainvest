import { LitElement, html, css, unsafeHTML } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js'
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

  connectedCallback() {
    super.connectedCallback()
    //this.loadBootstrap()
    //this.loadBootstrapSelect()
  }

  usefullDisplayMask = (mask) => {
    let displayMask = {}
    for (let column in mask) {
      if (mask[column].usefull) {
        displayMask[column] = mask[column]
      }
    }
    return displayMask
  }

  loadBootstrap() {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
    script.integrity = 'sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz'
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      console.log('Bootstrap loaded')
    }
    this.shadowRoot.appendChild(script)
  }

  loadBootstrapSelect = () => {
    let script = document.createElement('script')
    script.onload = this.onLoad.bind(this)
    script.src = 'https://cdn.jsdelivr.net/npm/use-bootstrap-select@2.2.0/dist/use-bootstrap-select.min.js'
    script.onload = () => {
      console.log('Bootstrap select loaded')
    }
    this.shadowRoot.appendChild(script)
  }

  onLoad() {
    console.log('Script loaded')
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      const usefullRecipeDisplayMask = this.usefullDisplayMask(recipeDisplayMask)
      const usefullRecipeSubsDisplayMask = this.usefullDisplayMask(recipeSubsDisplayMask)

      this.articole = []
      this.data.forEach((reteta) => {
        reteta.reteta.forEach((activitate) => {
          let articol = activitate.object
          let newArticol = {}
          let newSubarticole = []

          for (let key in usefullRecipeDisplayMask) {
            if (Object.keys(articol).includes(key)) {
              newArticol[key] = articol[key]
            }
          }

          let subarticole = activitate.children.map((subarticol) => subarticol.object)
          for (let subarticol of subarticole) {
            let newSubarticol = {}
            for (let key in usefullRecipeSubsDisplayMask) {
              if (Object.keys(subarticol).includes(key)) {
                if (usefullRecipeSubsDisplayMask[key].type === 'boolean') {
                  if (subarticol[key] === 1) {
                    newSubarticol[key] = unsafeHTML(usefullRecipeSubsDisplayMask[key].UI.true)
                  } else {
                    newSubarticol[key] = unsafeHTML(usefullRecipeSubsDisplayMask[key].UI.false)
                  }
                } else if (usefullRecipeSubsDisplayMask[key].type === 'number') {
                  newSubarticol[key] = isNaN(parseFloat(subarticol[key]))
                    ? 0
                    : parseFloat(subarticol[key]).toFixed(2)
                } else {
                  newSubarticol[key] = subarticol[key]
                }
              }
            }
            newSubarticole.push(newSubarticol)
          }

          this.articole.push({
            reteta: { id: reteta.id, name: reteta.name, type: reteta.type },
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
                ${Object.keys(usefullRecipeDisplayMask).map((key) =>
                  usefullRecipeDisplayMask[key].visible
                    ? html`<th>${usefullRecipeDisplayMask[key].label || key}</th>`
                    : ''
                )}
              </tr>
            </thead>
            <tbody>
              ${this.articole.map(
                (item, index) => html`
                  <tr
                    data-index="${index}"
                    class="${item.subarticole.length > 0 ? 'table-light' : ''}"
                    style="${item.reteta.type && item.reteta.type.includes('grupare artificiala')
                      ? 'border-left: 2px solid #ffc107; border-right: 2px solid #ffc107;'
                      : ''}"
                    @contextmenu="${(e) => this.handleContextMenu(e, item.articol)}"
                  >
                    <td>
                      ${item.subarticole.length > 0
                        ? html`<i
                            class="bi bi-plus-square"
                            style="cursor: pointer;"
                            @click="${() => this.toggleSubarticles(index)}"
                          ></i>`
                        : ''}
                    </td>
                    ${Object.keys(usefullRecipeDisplayMask).map(
                      (key) =>
                        html`<td
                          contenteditable="${usefullRecipeDisplayMask[key].RW}"
                          class="${usefullRecipeDisplayMask[key].visible ? '' : 'hidden'}"
                        >
                          ${item.articol[key]}
                        </td>`
                    )}
                  </tr>
                  <tr
                    class="subarticle hidden"
                    data-parent-index="${index}"
                    style="${item.reteta.type && item.reteta.type.includes('grupare artificiala')
                      ? 'border-left: 2px solid #ffc107; border-right: 2px solid #ffc107;'
                      : ''}"
                    @contextmenu="${(e) => this.handleContextMenu(e, item.subarticole)}"
                  >
                    <td colspan="${Object.keys(usefullRecipeDisplayMask).length + 1}">
                      <table class="table table-sm is-responsive" style="font-size: small;">
                        <thead>
                          <tr>
                            <th>
                              <div class="dropdown">
                                <button
                                  class="btn btn-sm btn-light dropdown-toggle"
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
                            ${Object.keys(usefullRecipeSubsDisplayMask).map((key) =>
                              usefullRecipeSubsDisplayMask[key].visible
                                ? html`<th>${usefullRecipeSubsDisplayMask[key].label || key}</th>`
                                : ''
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          ${item.subarticole.map(
                            (sub) => html`
                              <tr @contextmenu="${(e) => this.handleContextMenu(e, sub)}">
                                <td></td>
                                ${Object.keys(usefullRecipeSubsDisplayMask).map(
                                  (key) => html`
                                    <td
                                      contenteditable="${usefullRecipeSubsDisplayMask[key].RW}"
                                      class="${usefullRecipeSubsDisplayMask[key].visible ? '' : 'hidden'}"
                                    >
                                      ${sub[key]}
                                    </td>
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

  handleContextMenu(event, item) {
    event.preventDefault()
    console.log('Context menu opened for:', item)

    // Close all existing popovers
    const existingPopovers = this.shadowRoot.querySelectorAll('.popover')
    existingPopovers.forEach((popover) => popover.remove())

    // Create a new popover
    const popover = document.createElement('div')
    popover.className = 'popover'
    popover.style.position = 'absolute'
    popover.style.top = `${event.clientY}px`
    popover.style.left = `${event.clientX}px`
    popover.style.backgroundColor = 'white'
    popover.style.border = '1px solid black'
    popover.style.padding = '5px'
    popover.style.zIndex = '1000'
    popover.style.boxShadow = '3px 3px 3px rgba(0, 0, 0, 0.6)'
    popover.style.borderRadius = '5px'
    popover.innerHTML = `<div class="btn-group" role="group">
      <button type="button" class="btn btn-primary" @click="${() => this.toggleSelect(item)}">
        <i class="bi bi-plus-square"></i> Add
      </button>
      <button type="button" class="btn btn-secondary" @click="${() => this.editArticle(item)}">
        <i class="bi bi-pencil-square"></i> Edit
      </button>
      <button type="button" class="btn btn-danger" @click="${() => this.deleteArticle(item)}">
        <i class="bi bi-trash"></i> Delete
      </button>
    </div>`
    this.shadowRoot.appendChild(popover)

    // Close the popover when clicking outside of it
    document.addEventListener(
      'click',
      (e) => {
        if (!popover.contains(e.target)) {
          popover.remove()
        }
      },
      { once: true }
    )
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
