import { theadIsSet, LitElement, html, unsafeHTML, ds_instanteRetete, trees } from '../client.js'

/* global bootstrap */

class UI1 extends LitElement {
  static properties = {
    data: { type: Array },
    mainMask: { type: Object },
    subsMask: { type: Object },
    _filteredArticole: { type: Array, state: true } // Add this new property
  }

  // Internal variables
  _modalInstance = null
  _dropdownItems = [
    'Material',
    'Transport',
    'Utilaj',
    'Echipament',
    'Manopera',
    'Manopera+Material',
    'Manopera+Transport',
    'Manopera+Utilaj',
    'Manopera+Echipament'
  ]
  _parentIsUnfolded = false
  _hasMainHeader = true
  _hasSubHeader = true
  _canAddInLine = true
  _isInitialized = false

  _articole = []

  set hasMainHeader(value) {
    this._hasMainHeader = value
  }

  get hasMainHeader() {
    return this._hasMainHeader
  }

  set hasSubHeader(value) {
    this._hasSubHeader = value
  }

  get hasSubHeader() {
    return this._hasSubHeader
  }

  set canAddInLine(value) {
    this._canAddInLine = value
  }

  get canAddInLine() {
    return this._canAddInLine
  }

  constructor() {
    super()
    this.articole = []
  }

  connectedCallback() {
    super.connectedCallback()
    this.data = []
  }

  updated(changedProperties) {
    if (changedProperties.has('data') || changedProperties.has('mainMask')) {
      // Initialize _articole and _filteredArticole when data changes
      if (this.data && this.data.length > 0) {
        const usefullEntityDisplayMask = this.usefullDisplayMask(this.mainMask)
        const usefullEntitySubsDisplayMask = this.usefullDisplayMask(this.subsMask)

        this._articole = this.data.flatMap((box) =>
          box.content.map((activitate) => {
            const articol = activitate.object
            const newArticol = this.extractFields(articol, usefullEntityDisplayMask)
            const subarticole = activitate.children.map((subarticol) =>
              this.extractFields(subarticol.object, usefullEntitySubsDisplayMask)
            )

            return {
              meta: box.meta,
              articol: { ...newArticol, visible: true },
              subarticole: subarticole.map(sub => ({ ...sub, visible: true }))
            }
          })
        )
        
        this._filteredArticole = [...this._articole]
      }

      if (!this._isInitialized && this.mainMask) {
        this.createFilterModal()
        this.addEventListener('click', (e) => {
          if (e.target.id === 'showFilterModal') {
            this._modalInstance.show()
          }
        })
        this._isInitialized = true
      }
    }
  }

  createFilterModal() {
    const modal = document.createElement('div')
    modal.id = 'filterModal'
    modal.className = 'modal'
    modal.innerHTML = `
      <div role="dialog" class="modal-dialog modal-dialog-scrollable modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Filtru compus</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            ${this.generateFilterForm()}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Inchide</button>
            <button type="button" class="btn btn-warning" id="resetFilterButton">Reset</button>
            <button type="button" class="btn btn-primary" id="applyFilterButton">Aplica filtrul</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    this._modalInstance = new bootstrap.Modal(modal, {
      keyboard: true,
      backdrop: false
    })

    modal.querySelector('#applyFilterButton').addEventListener('click', () => this.applyFilter())
    modal.querySelector('#resetFilterButton').addEventListener('click', () => this.resetFilter())
  }

  resetFilter() {
    // Reset all filter inputs
    const filterableFields = Object.keys(this.mainMask).filter((key) => this.mainMask[key].isFilterable)
    
    filterableFields.forEach((key) => {
      const input = document.getElementById(key)
      if (input) {
        input.value = ''
      }
    })
    
    // Reset visibility flags
    this._filteredArticole = this._articole.map(item => ({
      ...item,
      articol: { ...item.articol, visible: true },
      subarticole: item.subarticole.map(sub => ({ ...sub, visible: true }))
    }))

    this.requestUpdate()
    this._modalInstance.hide()
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

  generateFilterForm() {
    const filterableFields = Object.keys(this.mainMask)
      .filter((key) => this.mainMask[key].isFilterable)
      .filter((key) =>
        this._articole.some(
          (item) => item.articol[key] !== undefined || item.subarticole.some((sub) => sub[key] !== undefined)
        )
      )
      .map((key) => {
        if (this.mainMask[key].filter === 'filter') {
          return `
            <div class="mb-3">
              <label for="${key}" class="form-label">${this.mainMask[key].label}</label>
              <select class="form-select form-select-sm" id="${key}" name="${key}">
                ${this.getFilterOptions(key)}
              </select>
            </div>
          `
        } else {
          return `
            <div class="mb-3">
              <label for="${key}" class="form-label">${this.mainMask[key].label}</label>
              <input type="text" class="form-control form-control-sm" list="datalistOptions" id="${key}" name="${key}" placeholder="Cauta...">
              <datalist id="datalistOptions">
                ${this.getFilterOptions(key)}
              </datalist>
            </div>
          `
        }
      })
    return filterableFields.join('')
  }

  getFilterOptions(key) {
    const options = new Set()
    // Add 'All' option first
    options.add('')
    this._articole.forEach((item) => {
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
      .map((option) => `<option value="${option}">${option || 'All'}</option>`)
      .join('')
  }

  applyFilter() {
    const filterValues = {}
    const filterableFields = Object.keys(this.mainMask).filter((key) => this.mainMask[key].isFilterable)
    
    filterableFields.forEach((key) => {
      const input = document.getElementById(key)
      if (input && input.value) {
        filterValues[key] = input.value
      }
    })

    // If no filters are set, show everything
    if (Object.keys(filterValues).length === 0) {
      this._filteredArticole = this._articole.map(item => ({
        ...item,
        articol: { ...item.articol, visible: true },
        subarticole: item.subarticole.map(sub => ({ ...sub, visible: true }))
      }))
    } else {
      this._filteredArticole = this._articole.map(item => {
        // Check article visibility
        const articleVisible = Object.entries(filterValues).every(([key, value]) => 
          item.articol[key]?.toString().toLowerCase().includes(value.toLowerCase())
        )

        // Check subarticole visibility 
        const subarticoleVisible = item.subarticole.map(sub => {
          const subVisible = Object.entries(filterValues).every(([key, value]) =>
            sub[key]?.toString().toLowerCase().includes(value.toLowerCase())
          )
          return { ...sub, visible: subVisible }
        })

        // Article is visible if it matches or any of its subarticole match
        const anySubVisible = subarticoleVisible.some(sub => sub.visible)
        
        return {
          ...item,
          articol: { ...item.articol, visible: articleVisible || anySubVisible },
          subarticole: subarticoleVisible
        }
      })
    }

    this.requestUpdate()
    this._modalInstance.hide()
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<div class="alert alert-warning p-3" role="alert">No data.</div>`
    }

    const usefullEntityDisplayMask = this.usefullDisplayMask(this.mainMask)
    const usefullEntitySubsDisplayMask = this.usefullDisplayMask(this.subsMask)

    return html`
      <div class="container-fluid">
        <table class="table table-sm is-responsive table-hover ms-4" style="font-size: small;">
          <thead>
            <tr>
              ${this.generateHeaders(usefullEntityDisplayMask, usefullEntitySubsDisplayMask)}
            </tr>
          </thead>
          ${this._filteredArticole?.map((item, index) =>
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

  extractFields(object, mask) {
    const newObject = {}
    for (let key in mask) {
      if (Object.keys(object).includes(key)) {
        if (mask[key].type === 'boolean') {
          newObject[key] = object[key] === 1 ? object[key] : object[key]
        } else if (mask[key].type === 'number') {
            newObject[key] = isNaN(parseFloat(object[key])) 
            ? 0 
            : Number.isInteger(parseFloat(object[key])) 
              ? parseFloat(object[key]) 
              : parseFloat(object[key]).toFixed(4)
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
        <div class="col"><i id="showFilterModal" class="bi bi-filter-square text-success fs-5"></i></div>
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
        const headerContent = hasActions ? this.articleActionsBar() : usefullEntityDisplayMask[key].label || key

        // Check if there are any values for this key in the cells
        const hasValues = this._articole.some((item) => item.articol[key] !== undefined)

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
                  ${this._dropdownItems.map(
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
                        ? this.subarticleActionsBar(item)
                        : usefullEntitySubsDisplayMask[subKey].label || subKey
                      // Check if there are any values for this subKey in the cells
                      const hasValues = item.subarticole.some((sub) => sub[subKey] !== undefined)
                      if (this._hasSubHeader) {
                        if (hasValues) {
                          return html`<th class="${zoneClass}">${headerContent}</th>`
                        }
                      } else if (hasActions) {
                        return html`<th class="${zoneClass}">${this.subarticleActionsBar(item)}</th>`
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
                const hasActions = usefullEntitySubsDisplayMask[subKey].hasActions || false
                const headerContent = hasActions
                  ? this.subarticleActionsBar(item)
                  : usefullEntitySubsDisplayMask[subKey].label || subKey
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
        if (this._canAddInLine) {
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

  articleActionsBar(item) {
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
            ${this._dropdownItems.map(
              (dropdownItem) =>
                html`<li>
                  <a class="dropdown-item" href="#" @click="${() => this.addSub(item)}">${dropdownItem}</a>
                </li>`
            )}
          </ul>
        </div>
        <div class="col">
          <button type="button" class="btn btn-sm" @click="${(e) => this.saveArticle(item, e.target)}">
            <i class="bi bi-save text-info"></i> Salveaza
          </button>
        </div>
        <div class="col pt-1 fs-6">
          <div class="form-check form-switch">
            <input
              type="checkbox"
              role="switch"
              class="form-check-input"
              id="checkboxConfirmare"
              name="checkboxConfirmare"
            />
            <label class="form-check-label" for="checkboxConfirmare"
              ><i class="bi bi-lock"></i
            ></label>
          </div>
        </div>
      </div>
    `
  }

  subarticleActionsBar(item) {
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
            ${this._dropdownItems.map(
              (dropdownItem) =>
                html`<li>
                  <a class="dropdown-item" href="#" @click="${() => this.addSub(item)}">${dropdownItem}</a>
                </li>`
            )}
          </ul>
        </div>
        <div class="col">
          <button type="button" class="btn btn-sm" @click="${(e) => this.saveArticle(item, e.target)}">
            <i class="bi bi-save text-info"></i> Salveaza
          </button>
        </div>
      </div>
    `
  }

  addSub(item) {
    console.log('Add sub', item)
    //daca dropdown contine manopera
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
