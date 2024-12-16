import { theadIsSet, LitElement, html, unsafeHTML, ds_instanteRetete, trees } from '../client.js'

/* global bootstrap */

class UI1 extends LitElement {
  static properties = {
    data: { type: Array },
    dropdownItems: { type: Array },
    mainMask: { type: Object },
    subsMask: { type: Object },
    hasMainHeader: { type: Boolean },
    hasSubHeader: { type: Boolean },
    canAddInLine: { type: Boolean }
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
    this.hasMainHeader = true
    this.hasSubHeader = true
    this.canAddInLine = true
  }

  connectedCallback() {
    super.connectedCallback()
    //... do something when connected
    this.addEventListener('click', (e) => {
      if (e.target.id === 'planificareNoua') {
        this.showFilterModal()
      }
    })
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

  getBorderStyle(type, length) {
    if (length > 0) {
      if (type && type.includes('grupare artificiala')) {
        return 'border-left: 2px solid var(--bs-warning);'
      } else {
        return 'border-left: 2px solid var(--bs-info);'
      }
    } else {
      return ''
    }
  }

  showFilterModal() {
    const modal = document.createElement('div')
    modal.id = 'filterModal'
    modal.className = 'modal'
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Filtru</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${this.generateFilterForm()}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary" @click="${this.applyFilter}">Apply Filter</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const modalInstance = new bootstrap.Modal(modal)
    modalInstance.show()
  }

  generateFilterForm() {
    const filterableFields = Object.keys(this.mainMask)
      .filter((key) => this.mainMask[key].isFilterable)
      .map((key) => {
        if (this.mainMask[key].filter === 'filter') {
          return `
            <div class="mb-3">
              <label for="${key}" class="form-label">${this.mainMask[key].label}</label>
              <select class="form-select" id="${key}" name="${key}">
                ${this.getFilterOptions(key)}
              </select>
            </div>
          `
        } else {
          return `
            <div class="mb-3">
              <label for="${key}" class="form-label">${this.mainMask[key].label}</label>
              <input type="text" class="form-control" id="${key}" name="${key}">
            </div>
          `
        }
      })
    return filterableFields.join('')
  }

  getFilterOptions(key) {
    const options = new Set()
    this.articole.forEach((item) => {
      if (item.articol[key]) {
        options.add(item.articol[key])
      }
      item.subarticole.forEach((sub) => {
        if (sub[key]) {
          options.add(sub[key])
        }
      })
    })
    return Array.from(options)
      .map((option) => `<option value="${option}">${option}</option>`)
      .join('')
  }

  applyFilter() {
    const filterValues = {}
    const filterableFields = Object.keys(this.mainMask).filter((key) => this.mainMask[key].isFilterable)
    filterableFields.forEach((key) => {
      const input = document.getElementById(key)
      if (input) {
        filterValues[key] = input.value
      }
    })

    this.articole.forEach((item) => {
      let visible = true
      filterableFields.forEach((key) => {
        if (filterValues[key] && item.articol[key] !== filterValues[key]) {
          visible = false
        }
      })
      item.articol.visible = visible
      item.subarticole.forEach((sub) => {
        let subVisible = true
        filterableFields.forEach((key) => {
          if (filterValues[key] && sub[key] !== filterValues[key]) {
            subVisible = false
          }
        })
        sub.visible = subVisible
      })
    })

    this.requestUpdate()
    document.getElementById('filterModal').hide()
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<div class="alert alert-warning p-3" role="alert">No data.</div>`
    } else {
      const usefullEntityDisplayMask = this.usefullDisplayMask(this.mainMask)
      const usefullEntitySubsDisplayMask = this.usefullDisplayMask(this.subsMask)

      this.articole = this.data.flatMap((box) =>
        box.content.map((activitate) => {
          const articol = activitate.object
          const newArticol = this.extractFields(articol, usefullEntityDisplayMask)
          const subarticole = activitate.children.map((subarticol) =>
            this.extractFields(subarticol.object, usefullEntitySubsDisplayMask)
          )

          return {
            meta: box.meta,
            articol: newArticol,
            subarticole: subarticole
          }
        })
      )

      // Initially set all items to visible
      this.articole.forEach((item) => {
        item.articol.visible = true
        item.subarticole.forEach((sub) => {
          sub.visible = true
        })
      })

      console.log('articole', this.articole)

      const headers = this.generateHeaders(usefullEntityDisplayMask, usefullEntitySubsDisplayMask)

      return html`
        <div class="container-fluid">
          <table class="table table-sm is-responsive table-hover ms-4" style="font-size: small;">
            <thead>
              <tr>
                ${headers}
              </tr>
            </thead>
            ${this.articole.map(
              (item, index) =>
                item.articol.visible
                  ? html`<tbody>
                      ${this.renderArticleRow(
                        item,
                        index,
                        usefullEntityDisplayMask,
                        usefullEntitySubsDisplayMask
                      )}
                    </tbody>`
                  : ''
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

  generateHeaders(usefullEntityDisplayMask, usefullEntitySubsDisplayMask) {
    const headers = [
      html`<th rowspan="2">
        <div class="col"><i id="planificareNoua" class="bi bi-filter-square text-success fs-5"></i></div>
      </th>`
    ]

    Object.keys(usefullEntityDisplayMask).forEach((key) => {
      if (usefullEntityDisplayMask[key].visible) {
        const subKeys = Object.keys(usefullEntitySubsDisplayMask).filter(
          (subKey) =>
            usefullEntitySubsDisplayMask[subKey].visible &&
            usefullEntitySubsDisplayMask[subKey].master === key
        )
        const colspan = subKeys.length || 1
        const hasActions = usefullEntityDisplayMask[key].hasActions || false
        const headerContent = hasActions ? this.actionsBar() : usefullEntityDisplayMask[key].label || key

        // Check if there are any values for this key in the cells
        const hasValues = this.articole.some((item) => item.articol[key] !== undefined)

        if (hasValues) {
          headers.push(html`<th colspan="${colspan}">${headerContent}</th>`)
        }
      }
    })

    return headers
  }

  renderArticleRow(item, index, usefullEntityDisplayMask, usefullEntitySubsDisplayMask) {
    return html`
      <tr
        data-index="${index}"
        class="${item.subarticole.length > 0 ? 'table-light' : ''}"
        style="${this.getBorderStyle(item.meta.type, item.subarticole.length)}"
        @contextmenu="${(e) => this.handleContextMenu(e, item)}"
        @mouseenter="${(e) => this.handleMouseEnterSingleArticol(e, item)}"
        @mouseleave="${(e) => this.handleMouseLeaveSingleArticol(e, item)}"
      >
        <td style="min-width: 30px;" class="align-middle">
          ${item.subarticole.length > 0
            ? html`<i
                class="bi bi-plus-square"
                style="cursor: pointer;"
                @click="${() => this.toggleSubarticles(index)}"
              ></i>`
            : html`<div class="dropdown p-0 m-0 col d-none">
                <i
                  class="bi bi-plus-square text-primary dropdown-toggle"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                ></i>
                <ul class="dropdown-menu">
                  ${this.dropdownItems.map(
                    (dropdownItem) =>
                      html`<li>
                        <a class="dropdown-item" href="#" @click="${() => this.addSub(item)}"
                          >${dropdownItem}</a
                        >
                      </li>`
                  )}
                </ul>
              </div>`}
        </td>
        ${Object.keys(usefullEntityDisplayMask).map((key) => {
          if (usefullEntityDisplayMask[key].visible) {
            const colspan =
              Object.keys(usefullEntitySubsDisplayMask).filter(
                (subKey) =>
                  usefullEntitySubsDisplayMask[subKey].visible &&
                  usefullEntitySubsDisplayMask[subKey].master === key
              ).length || 1
            const zoneClass = usefullEntityDisplayMask[key].verticalDelimiterStyleClass || ''
            const hasValues = item.articol[key] !== undefined
            if (hasValues) {
              return html`<td
                colspan="${colspan}"
                contenteditable="${usefullEntityDisplayMask[key].RW}"
                class="${zoneClass}"
                @focusin="${(e) => this.handleFocusIn(e, item, key)}"
                @focusout="${(e) => this.saveLineArticle(item.articol, e.target, e.target.textContent)}"
                @keydown="${(e) => this.handleKeyDown(e, item, key)}"
              >
                ${item.articol[key]}
              </td>`
            }
          }
        })}
      </tr>
      ${item.subarticole.length > 0
        ? html`
            <tr
              class="subarticle-header d-none"
              data-parent-index="${index}"
              style="${this.getBorderStyle(item.meta.type, item.subarticole.length)}"
            >
              <td></td>
              ${Object.keys(usefullEntityDisplayMask).map((key) => {
                if (usefullEntityDisplayMask[key].visible) {
                  const subKeys = Object.keys(usefullEntitySubsDisplayMask).filter(
                    (subKey) =>
                      usefullEntitySubsDisplayMask[subKey].visible &&
                      usefullEntitySubsDisplayMask[subKey].master === key
                  )
                  if (subKeys.length > 0) {
                    return subKeys.map((subKey) => {
                      const zoneClass = usefullEntitySubsDisplayMask[subKey].verticalDelimiterStyleClass || ''
                      const hasActions = usefullEntitySubsDisplayMask[subKey].hasActions || false
                      const headerContent = hasActions
                        ? this.actionsBar(item)
                        : usefullEntitySubsDisplayMask[subKey].label || subKey
                      // Check if there are any values for this subKey in the cells
                      const hasValues = item.subarticole.some((sub) => sub[subKey] !== undefined)
                      if (this.hasSubHeader) {
                        if (hasValues) {
                          return html`<th class="${zoneClass}">${headerContent}</th>`
                        }
                      } else if (hasActions) {
                        return html`<th class="${zoneClass}">${this.actionsBar(item)}</th>`
                      }
                    })
                  } else {
                    return html`<th style="display:none"></th>`
                  }
                }
              })}
            </tr>
          `
        : ''}
      ${item.subarticole.map((sub) =>
        sub.visible
          ? this.renderSubarticleRow(item, sub, index, usefullEntityDisplayMask, usefullEntitySubsDisplayMask)
          : ''
      )}
      <tr class="spacer"></tr>
    `
  }

  renderSubarticleRow(item, sub, index, usefullEntityDisplayMask, usefullEntitySubsDisplayMask) {
    return html`
      <tr
        class="subarticle d-none"
        style="${this.getBorderStyle(item.meta.type, item.subarticole.length)}"
        data-parent-index="${index}"
        @contextmenu="${(e) => this.handleContextMenu(e, sub)}"
      >
        <td></td>
        ${Object.keys(usefullEntityDisplayMask).map((key) => {
          if (usefullEntityDisplayMask[key].visible) {
            const subKeys = Object.keys(usefullEntitySubsDisplayMask).filter(
              (subKey) =>
                usefullEntitySubsDisplayMask[subKey].visible &&
                usefullEntitySubsDisplayMask[subKey].master === key
            )
            if (subKeys.length > 0) {
              return subKeys.map((subKey) => {
                const zoneClass = usefullEntitySubsDisplayMask[subKey].verticalDelimiterStyleClass || ''
                const hasValues = sub[subKey] !== undefined
                if (hasValues) {
                  return html`<td
                    contenteditable="${usefullEntitySubsDisplayMask[subKey].RW}"
                    class="${zoneClass}"
                    @focusin="${(e) => this.handleFocusIn(e, sub, subKey)}"
                    @focusout="${(e) => this.saveLineSubArticle(sub, e.target, e.target.textContent)}"
                    @keydown="${(e) => this.handleKeyDown(e, sub, subKey)}"
                  >
                    ${sub[subKey]}
                  </td>`
                }
              })
            }
          }
        })}
      </tr>
    `
  }

  handleMouseEnterSingleArticol(event, item) {
    if (item.subarticole.length) {
      const tr = event.target.closest('tr')
      if (tr && !tr.dataset.popoverShown) {
        tr.dataset.popoverShown = true
        const isArtOfCount = item.subarticole.filter((sub) => sub.ISARTOF === 1).length || 0
        const totalSubCount = item.subarticole.length
        const nrInstante = Object.keys(item.meta).includes('id')
          ? ds_instanteRetete.filter((inst) => inst.duplicateOf === item.meta.id).length
          : 0
        const popoverContent = `
          <span class="badge badge-sm text-bg-info">${totalSubCount}</span>
          ${isArtOfCount !== 0 ? `<span class="badge badge-sm text-bg-warning">${isArtOfCount}</span>` : ''}
          ${nrInstante !== 0 ? `<span class="badge badge-sm text-bg-secondary">${nrInstante}</span>` : ''}
        `
        const popover = document.createElement('div')
        popover.className = 'popover'
        popover.style.position = 'absolute'
        popover.style.border = 'none'
        popover.innerHTML = popoverContent
        this.appendChild(popover)
        const rect = tr.getBoundingClientRect()
        const containerRect = this.getBoundingClientRect()
        popover.style.top = `${rect.top - containerRect.top}px`
        //popover.style.left = `${rect.left - containerRect.left + rect.width}px`
        popover.style.left = `0px`
        setTimeout(() => {
          popover.remove()
          delete tr.dataset.popoverShown // Allow popover to be shown again
        }, 3000)
      }
    } else {
      const tr = event.target.closest('tr')
      const dropdown = tr.querySelector('td .dropdown')
      if (dropdown) {
        if (this.canAddInLine) {
          dropdown.classList.remove('d-none')
        }
      } else {
        console.log('No dropdown found')
      }
    }
  }

  handleMouseLeaveSingleArticol(event, item) {
    const tr = event.target.closest('tr')
    const dropdown = tr.querySelector('td .dropdown')
    if (dropdown) {
      dropdown.classList.add('d-none')
    } else {
      console.log('No dropdown found')
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

  handleFocusIn(event, item, key) {
    //selecteaza continutul pentru o editare mai usoara
    const td = event.target
    const range = document.createRange()
    range.selectNodeContents(td)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  handleKeyDown(event, item, key) {
    //navigheaza intre celulele editabile cu sagetile sus/jos si stanga/dreapta
    //stanga dreapta - navigheaza intre celulele din acelasi rand, circular
    //sus jos - navigheaza intre randuri
    const td = event.target
    const tr = td.parentElement
    const trs = [...tr.parentElement.children]
    const tds = [...tr.children]
    const index = tds.indexOf(td)
    const rowIndex = trs.indexOf(tr)
    const keyName = event.key
    if (keyName === 'ArrowRight') {
      if (index < tds.length - 1) {
        tds[index + 1].focus()
      } else {
        tds[0].focus()
      }
    } else if (keyName === 'ArrowLeft') {
      if (index > 0) {
        tds[index - 1].focus()
      } else {
        tds[tds.length - 1].focus()
      }
    } else if (keyName === 'ArrowDown') {
      if (rowIndex < trs.length - 1) {
        trs[rowIndex + 1].children[index].focus()
      }
    } else if (keyName === 'ArrowUp') {
      if (rowIndex > 0) {
        trs[rowIndex - 1].children[index].focus()
      }
    }
  }

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
          <button type="button" class="btn btn-sm" @click="${(e) => this.savePackage(item, e.target)}">
            <i class="bi bi-save text-info"></i> Salveaza
          </button>
        </div>
      </div>
    `
  }

  addSub(item) {
    console.log('Add sub', item)
  }

  savePackage(item) {
    console.log('Save article', item)
  }

  saveLineArticle(item, htmlElement, value) {
    console.log('Save line', item, htmlElement, value)
  }

  saveLineSubArticle(item, htmlElement, value) {
    console.log('Save sub', item, htmlElement, value)
  }
}

export default UI1
