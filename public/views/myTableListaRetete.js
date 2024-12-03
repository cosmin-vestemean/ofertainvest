import { LitElement, html, css } from 'lit'
import { recipeDisplayMask, recipeSubsDisplayMask } from './masks.js'

class MyTableListaRetete extends LitElement {
  static properties = {
    data: { type: Array },
    dropdownItems: { type: Array }
  }

  constructor() {
    super()
    this.data = []
    this.articole = []
    this.dropdownItems = [
      'Material',
      'Manopera',
      'Transport',
      'Utilaj',
      'Echipament',
      'Material+Manopera',
      'Material+Transport',
      'Material+Utilaj',
      'Material+Echipament'
    ]
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

      this.articole = this.data.flatMap((reteta) =>
        reteta.reteta.map((activitate) => {
          const articol = activitate.object
          const newArticol = this.extractFields(articol, usefullRecipeDisplayMask)
          const subarticole = activitate.children.map((subarticol) =>
            this.extractFields(subarticol.object, usefullRecipeSubsDisplayMask)
          )

          return {
            reteta: { id: reteta.id, name: reteta.name, type: reteta.type },
            articol: newArticol,
            subarticole: subarticole
          }
        })
      )

      console.log('articole', this.articole)

      const headers = this.generateHeaders(usefullRecipeDisplayMask, usefullRecipeSubsDisplayMask)

      return html`
        <div class="container-fluid">
          <table class="table table-sm is-responsive" style="font-size: small;">
            <thead>
              <tr>
                ${headers}
              </tr>
            </thead>
            ${this.articole.map(
              (item, index) => html`
                <tbody class="cardReteta shadow-sm">
                  ${this.renderArticleRow(
                    item,
                    index,
                    usefullRecipeDisplayMask,
                    usefullRecipeSubsDisplayMask
                  )}
                  ${item.subarticole.map((sub, subIndex) =>
                    this.renderSubarticleRow(
                      sub,
                      index,
                      subIndex,
                      item.reteta.type,
                      usefullRecipeDisplayMask,
                      usefullRecipeSubsDisplayMask
                    )
                  )}
                </tbody>
              `
            )}
          </table>
        </div>
      `
    }
  }

  extractFields(object, mask) {
    const newObject = {}
    for (let key in mask) {
      if (Object.keys(object).includes(key)) {
        if (mask[key].type === 'boolean') {
          newObject[key] = object[key] === 1 ? object[key] : object[key]
        } else if (mask[key].type === 'number') {
          newObject[key] = isNaN(parseFloat(object[key]))
            ? parseFloat(0).toFixed(2)
            : parseFloat(object[key]).toFixed(2)
        } else {
          newObject[key] = object[key]
        }
      }
    }
    return newObject
  }

  generateHeaders(usefullRecipeDisplayMask, usefullRecipeSubsDisplayMask) {
    const headers = [html`<th rowspan="2"></th>`]

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

    return headers
  }

  renderArticleRow(item, index, usefullRecipeDisplayMask, usefullRecipeSubsDisplayMask) {
    const isArtOfCount = item.subarticole.filter((sub) => sub.ISARTOF === 1).length
    return html`
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
        <td>${this.actionsBar(item, isArtOfCount)}</td>
      </tr>
    `
  }

  renderSubarticleRow(
    sub,
    index,
    subIndex,
    retetaType,
    usefullRecipeDisplayMask,
    usefullRecipeSubsDisplayMask
  ) {
    return html`
      <tr
        class="subarticle d-none"
        style="${retetaType && retetaType.includes('grupare artificiala')
          ? 'border-left: 2px solid #ffc107; border-right: 2px solid #ffc107;'
          : ''}"
        data-parent-index="${index}"
        data-sub-index="${subIndex}"
        @contextmenu="${(e) => this.handleContextMenu(e, sub)}"
        @mouseover="${(e) => this.handleMouseOver(e, sub)}"
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
                const zoneClass = usefullRecipeSubsDisplayMask[subKey].verticalDelimiterStyleClass || ''
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

  handleMouseOver(event, item) {
    const tr = event.target.closest('tr')
    if (tr && !tr.dataset.popoverShown) {
      tr.dataset.popoverShown = true
      const isArtOfCount = item.subarticole.filter((sub) => sub.ISARTOF === 1).length
      const totalSubCount = item.subarticole.length
      const popoverContent = `
        <span class="badge bg-info">ISARTOF: ${isArtOfCount}</span>
        <span class="badge bg-secondary">Total: ${totalSubCount}</span>
      `
      const popover = document.createElement('div')
      popover.className = 'popover'
      popover.style.position = 'absolute'
      popover.innerHTML = popoverContent
      this.appendChild(popover)
      const rect = tr.getBoundingClientRect()
      const containerRect = this.getBoundingClientRect()
      popover.style.top = `${rect.top - containerRect.top}px`
      popover.style.left = `${rect.left - containerRect.left + rect.width}px`
      setTimeout(() => {
        popover.remove()
        delete tr.dataset.popoverShown // Allow popover to be shown again
      }, 3000)
    }
  }

  actionsBar(item, isArtOfCount) {
    return html`
      <div class="actions-bar row">
        <div class="dropdown col">
          <button
            class="btn btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="bi bi-plus-square text-primary"></i>
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
        <button type="button" class="btn btn-sm col" @click="${() => this.saveArticle(item)}">
          <i class="bi bi-save text-info"></i>
        </button>
        ${isArtOfCount > 0 ? html`<span class="badge bg-primary">${isArtOfCount}</span>` : ''}
      </div>
    `
  }

  addSub(item) {
    console.log('Add sub', item)
  }

  saveArticle(item) {
    console.log('Save article', item)
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
