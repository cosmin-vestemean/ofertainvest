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
                  >
                    <td colspan="${Object.keys(usefullRecipeDisplayMask).length + 1}">
                      <table class="table table-sm is-responsive" style="font-size: small;">
                        <thead>
                          <tr>
                            <th></th>
                            ${Object.keys(usefullRecipeDisplayMask).map((key) =>
                              usefullRecipeSubsDisplayMask[key] && usefullRecipeSubsDisplayMask[key].visible
                                ? html`<th>${usefullRecipeSubsDisplayMask[key].label || key}</th>`
                                : html`<th></th>`
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          ${item.subarticole.map(
                            (sub) => html`
                              <tr @mouseover="${(e) => this.handleContextMenu(e, sub)}">
                                <td></td>
                                ${Object.keys(usefullRecipeDisplayMask).map(
                                  (key) =>
                                    html`<td
                                      contenteditable="${usefullRecipeSubsDisplayMask[key]?.RW || false}"
                                      class="${usefullRecipeSubsDisplayMask[key]?.visible ? '' : 'hidden'}"
                                    >
                                      ${sub[key] || ''}
                                    </td>`
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

    // Remove table-info class from all tr elements
    const allRows = this.shadowRoot.querySelectorAll('tr.table-info')
    allRows.forEach((row) => row.classList.remove('table-info'))

    // Close all existing popovers
    const existingPopovers = this.shadowRoot.querySelectorAll('.popover')
    existingPopovers.forEach((popover) => popover.remove())

    // Create a new popover
    const popover = document.createElement('div')
    popover.className = 'popover'
    popover.style.position = 'absolute'
    this.shadowRoot.appendChild(popover)
    popover.innerHTML = `<div class="btn-group" role="group">
      <button type="button" class="btn btn-sm btn-primary" @click="${() => this.toggleSelect(item)}">
        <i class="bi bi-plus-square"></i>
      </button>
      <button type="button" class="btn btn-sm btn-secondary" @click="${() => this.editArticle(item)}">
        <i class="bi bi-pencil-square"></i>
      </button>
      <button type="button" class="btn btn-sm btn-danger" @click="${() => this.deleteArticle(item)}">
        <i class="bi bi-trash"></i>
      </button>
      <button type="button" class="btn btn-sm btn-success" @click="${() => this.saveArticle(item)}">
        <i class="bi bi-check-square"></i>
      </button>
    </div>`

    // Adjust the position after adding the popover to the DOM
    const rect = this.shadowRoot.host.getBoundingClientRect()
    const tr = event.target.closest('tr')
    tr.classList.add('table-info')
    const trRect = tr.getBoundingClientRect()

    // Calculăm poziția `top` fără a adăuga offset-ul scrollTop
    /*
      Pentru ca popover-ul să se poziționeze corect, containerul părinte ar trebui să aibă stilul position: relative;. 
      Astfel, poziționarea absolută a popover-ului va fi relativă la acest container.
    */
    const y = trRect.top - rect.top

    popover.style.top = `${y}px`
    popover.style.left = `0px`

    // Close the popover when clicking outside of it
    document.addEventListener(
      'click',
      (e) => {
        if (!popover.contains(e.target)) {
          popover.remove()
          tr.classList.remove('table-info')
        }
      },
      { once: true }
    )
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
