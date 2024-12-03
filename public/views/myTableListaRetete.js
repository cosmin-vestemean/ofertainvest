import { template, theadIsSet, LitElement, html, css, unsafeHTML } from '../client.js'
import { recipeDisplayMask, recipeSubsDisplayMask } from './masks.js'

class MyTableListaRetete extends LitElement {
  static properties = {
    data: { type: Array }
  }

  constructor() {
    super()
    this.data = []
    this.articole = []
  }

  connectedCallback() {
    super.connectedCallback()
    //... do something when connected
  }

  createRenderRoot() {
    return this
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

      headers.push(html`<th rowspan="2"></th>`)

      Object.keys(usefullRecipeDisplayMask).forEach((key) => {
        if (usefullRecipeDisplayMask[key].visible) {
          const subKeys = Object.keys(usefullRecipeSubsDisplayMask).filter(
            (subKey) =>
              usefullRecipeSubsDisplayMask[subKey].visible &&
              usefullRecipeSubsDisplayMask[subKey].master === key
          )
          const colspan = subKeys.length || 1
          const hasActions = usefullRecipeDisplayMask[key].hasActions || false
          const headerContent = hasActions ? this.actionsBar() : usefullRecipeDisplayMask[key].label || key
          headers.push(html`<th colspan="${colspan}">${headerContent}</th>`)
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
                  ${item.subarticole.length > 0
                    ? html`
                        <!-- Add sub-article headers for this batch -->
                        <tr class="subarticle-header d-none" data-parent-index="${index}">
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
                                  const hasActions = usefullRecipeSubsDisplayMask[subKey].hasActions || false
                                  const headerContent = hasActions
                                    ? this.actionsBar(item)
                                    : usefullRecipeSubsDisplayMask[subKey].label || subKey
                                  return html`<th class="${zoneClass}">${headerContent}</th>`
                                })
                              } else {
                                return html`<th style="display:none"></th>`
                              }
                            }
                          })}
                        </tr>
                      `
                    : ''}
                  ${item.subarticole.map(
                    (sub) => html`
                      <tr
                        class="subarticle d-none"
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
    const rows = this.querySelectorAll(`tr[data-parent-index="${index}"]`)
    rows.forEach((row) => {
      row.classList.toggle('d-none')
    })
    // Toggle the icon
    const toggleIcon = this.querySelector(`tr[data-index="${index}"] i`)
    if (toggleIcon.classList.contains('bi-plus-square')) {
      toggleIcon.classList.remove('bi-plus-square')
      toggleIcon.classList.add('bi-dash-square')
    } else {
      toggleIcon.classList.add('bi-plus-square')
    }
  }

  handleContextMenu(event, item) {
    event.preventDefault()
    console.log('Context menu opened for:', item)

    // Remove table-info class from all tr elements
    const allRows = this.querySelectorAll('tr.table-info')
    allRows.forEach((row) => row.classList.remove('table-info'))

    // Close all existing popovers
    const existingPopovers = this.querySelectorAll('.popover')
    existingPopovers.forEach((popover) => popover.remove())

    // Create a new popover
    const popover = document.createElement('div')
    popover.className = 'popover'
    popover.style.position = 'absolute'
    this.appendChild(popover)
    popover.innerHTML = `<div class="btn-group" role="group">
      <button type="button" class="btn btn-sm" @click="${() => this.deleteSub(item)}">
        <i class="bi bi-trash text-danger"></i>
      </button>
    </div>`

    // Adjust the position after adding the popover to the DOM
    const rect = this.getBoundingClientRect()
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

  actionsBar(item) {
    return html`
      <!-- Custom HTML for actionsBar -->
      <div class="actions-bar">
        <!-- Your custom actions -->
        <button type="button" class="btn btn-sm" @click="${(e) => this.showPopover(e, item)}">
          <i class="bi bi-plus-square text-primary"></i>
        </button>
        <button type="button" class="btn btn-sm" @click="${() => this.saveArticle(item)}">
          <i class="bi bi-save text-info"></i>
        </button>
      </div>
    `
  }

  showPopover(event, item) {
    event.preventDefault()
    console.log('Show popover for:', item)
  }

  saveArticle(item) {
    console.log('Save article', item)
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
