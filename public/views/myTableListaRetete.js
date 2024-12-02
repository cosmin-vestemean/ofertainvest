import { template, theadIsSet, LitElement, html, css, unsafeHTML } from '../client.js'
import { recipeDisplayMask, recipeSubsDisplayMask } from './masks.js'

class MyTableListaRetete extends LitElement {
  static properties = {
    data: { type: Array }
  }

  static styles = css`
    .hidden {
      display: none;
    }
    .zone1, .zone2, .zone3 {
      border-right: 1px solid var(--bs-tertiary);
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
                    //newSubarticol[key] = unsafeHTML(usefullRecipeSubsDisplayMask[key].UI.true)
                    newSubarticol[key] = subarticol[key]
                  } else {
                    //newSubarticol[key] = unsafeHTML(usefullRecipeSubsDisplayMask[key].UI.false)
                    newSubarticol[key] = subarticol[key]
                  }
                } else if (usefullRecipeSubsDisplayMask[key].type === 'number') {
                  newSubarticol[key] = isNaN(parseFloat(subarticol[key]))
                    ? parseFloat(0).toFixed(2)
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

      // Prepare headers with grouped columns
      const headers = []
      const subHeaders = []

      headers.push(html`<th rowspan="2"></th>`)

      Object.keys(usefullRecipeDisplayMask).forEach((key) => {
        if (usefullRecipeDisplayMask[key].visible) {
          const subKeys = Object.keys(usefullRecipeSubsDisplayMask).filter(
            (subKey) =>
              usefullRecipeSubsDisplayMask[subKey].visible &&
              usefullRecipeSubsDisplayMask[subKey].master === key
          )
          const colspan = subKeys.length || 1
          headers.push(html`<th colspan="${colspan}">${usefullRecipeDisplayMask[key].label || key}</th>`)
          if (subKeys.length === 0) {
            subHeaders.push(html`<th style="display:none"></th>`)
          } else {
            subKeys.forEach((subKey) => {
              subHeaders.push(html`<th>${usefullRecipeSubsDisplayMask[subKey].label || subKey}</th>`)
            })
          }
        }
      })

      return html`
        <div class="container-fluid">
          <table class="table table-sm is-responsive" style="font-size: small;">
            <thead>
              <tr>
                ${headers}
              </tr>
              <!-- Remove the second header row -->
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
                    @contextmenu="${(e) => this.handleContextMenu(e, item)}"
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
                    ${Object.keys(usefullRecipeDisplayMask).map((key) => {
                      if (usefullRecipeDisplayMask[key].visible) {
                        const colspan =
                          Object.keys(usefullRecipeSubsDisplayMask).filter(
                            (subKey) =>
                              usefullRecipeSubsDisplayMask[subKey].visible &&
                              usefullRecipeSubsDisplayMask[subKey].master === key
                          ).length || 1
                        const zoneClass = usefullRecipeDisplayMask[key].verticalDelimiterStyleClass || ''
                        return html`<td
                          colspan="${colspan}"
                          contenteditable="${usefullRecipeDisplayMask[key].RW}"
                          class="${zoneClass}"
                        >
                          ${item.articol[key]}
                        </td>`
                      }
                    })}
                  </tr>
                  ${
                    item.subarticole.length > 0
                      ? html`
                          <!-- Add sub-article headers for this batch -->
                          <tr class="subarticle-header hidden" data-parent-index="${index}">
                            <td></td>
                            ${Object.keys(usefullRecipeDisplayMask).map((key) => {
                              if (usefullRecipeDisplayMask[key].visible) {
                                const subKeys = Object.keys(usefullRecipeSubsDisplayMask).filter(
                                  (subKey) =>
                                    usefullRecipeSubsDisplayMask[subKey].visible &&
                                    usefullRecipeSubsDisplayMask[subKey].master === key
                                )
                                if (subKeys.length > 0) {
                                  return subKeys.map((subKey) => {
                                    const zoneClass =
                                      usefullRecipeSubsDisplayMask[subKey].verticalDelimiterStyleClass || ''
                                    return html`<th class="${zoneClass}">
                                      ${usefullRecipeSubsDisplayMask[subKey].label || subKey}
                                    </th>`
                                  })
                                } else {
                                  return html`<th style="display:none"></th>`
                                }
                              }
                            })}
                          </tr>
                        `
                      : ''
                  }
                  ${item.subarticole.map(
                    (sub) => html`
                      <tr
                        class="subarticle hidden"
                        style="${item.reteta.type && item.reteta.type.includes('grupare artificiala')
                          ? 'border-left: 2px solid #ffc107; border-right: 2px solid #ffc107;'
                          : ''}"
                        data-parent-index="${index}"
                        @contextmenu="${(e) => this.handleContextMenu(e, sub)}"
                      >
                        <td></td>
                        ${Object.keys(usefullRecipeDisplayMask).map((key) => {
                          if (usefullRecipeDisplayMask[key].visible) {
                            const subKeys = Object.keys(usefullRecipeSubsDisplayMask).filter(
                              (subKey) =>
                                usefullRecipeSubsDisplayMask[subKey].visible &&
                                usefullRecipeSubsDisplayMask[subKey].master === key
                            )
                            if (subKeys.length > 0) {
                              return subKeys.map((subKey) => {
                                const zoneClass =
                                  usefullRecipeSubsDisplayMask[subKey].verticalDelimiterStyleClass || ''
                                return html`<td
                                  contenteditable="${usefullRecipeSubsDisplayMask[subKey].RW}"
                                  class="${zoneClass}"
                                >
                                  ${sub[subKey]}
                                </td>`
                              })
                            } else {
                              return html`<td></td>`
                            }
                          }
                        })}
                      </tr>
                    `
                  )}
                `
              )}
            </tbody>
          </table>
        </div>
      `
    }
  }

  toggleSubarticles(index) {
    const rows = this.shadowRoot.querySelectorAll(`tr[data-parent-index="${index}"]`)
    rows.forEach((row) => {
      row.classList.toggle('hidden')
    })
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
