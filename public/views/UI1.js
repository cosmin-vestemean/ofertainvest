import { theadIsSet, LitElement, html, unsafeHTML, ds_instanteRetete, contextOferta } from '../client.js'
import { tables } from '../utils/tables.js'
import { employeesService } from '../utils/employeesService.js'

/* global bootstrap */

class UI1 extends LitElement {
  static properties = {
    data: { type: Array },
    mainMask: { type: Object },
    subsMask: { type: Object },
    _filteredArticole: { type: Array, state: true }, // Add this new property
    _filterHistory: { type: Array, state: true },
    documentHeader: { type: Object },
    documentHeaderMask: { type: Object },
    angajati: { type: Array }
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
  _angajati = []
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
    this._filterHistory = JSON.parse(localStorage.getItem('filterHistory') || '[]')
    this.angajati = []
    this.mainMask = {} // Initialize empty
    this.subsMask = {}
    this.data = []
    this._filteredArticole = []
  }

  async connectedCallback() {
    super.connectedCallback()
    this.data = []
    this.mainMask = {}
    this.subsMask = {}
    this.documentHeader = {}
    this.documentHeaderMask = {}
  }

  async firstUpdated() {
    try {
      if (!this.angajati || this.angajati.length === 0) {
        // First check context
        if (contextOferta?.angajati?.length > 0) {
          this.angajati = contextOferta.angajati
        } else {
          // If not in context, load from service
          const employees = await employeesService.loadEmployees()
          if (employees?.length > 0) {
            this.angajati = employees
            // Cache for other components
            contextOferta.angajati = employees
          }
        }
      }
    } catch (error) {
      console.error('Failed to load employees:', error)
      this.angajati = [] // Ensure we have an empty array at minimum
    }

    this.requestUpdate()
  }

  updated(changedProperties) {
    if (changedProperties.has('data')) {
      console.log('UI1 received new data:', {
        received: this.data,
        isArray: Array.isArray(this.data),
        length: this.data?.length,
        firstItem: this.data?.[0]
      })
    }
    if (changedProperties.has('data') || changedProperties.has('mainMask')) {
      // Initialize _articole and _filteredArticole when data AND mainMask change
      if (this.data?.length > 0 && Object.keys(this.mainMask || {}).length > 0) {
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
              subarticole: subarticole.map((sub) => ({ ...sub, visible: true }))
            }
          })
        )

        this._filteredArticole = [...this._articole]
      }

      if (!this._isInitialized && Object.keys(this.mainMask || {}).length > 0) {
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
      <div role="dialog" class="modal-dialog modal-dialog-scrollable modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Filtru compus</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex justify-content-end mb-2">
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="filterHistoryDropdown" data-bs-toggle="dropdown">
                  <i class="bi bi-clock-history"></i> Istoric filtrări
                </button>
                <ul class="dropdown-menu dropdown-menu-end" id="filterHistoryList" style="min-width: 200px;">
                  ${this._filterHistory
                    .map(
                      (filter, index) => `
                    <li>
                      <a class="dropdown-item" href="#" data-filter-index="${index}">
                        ${this.formatFilterDescription(filter)}
                        <i class="bi bi-x text-danger float-end remove-filter" data-filter-index="${index}"></i>
                      </a>
                    </li>
                  `
                    )
                    .join('')}
                </ul>
              </div>
            </div>
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

    // Add click handlers for filter history
    const historyList = modal.querySelector('#filterHistoryList')
    historyList?.addEventListener('click', (e) => {
      const target = e.target
      if (target.classList.contains('remove-filter')) {
        e.preventDefault()
        e.stopPropagation()
        const index = parseInt(target.dataset.filterIndex)
        this.removeFromFilterHistory(index)
        return
      }

      const filterIndex = target.dataset.filterIndex
      if (filterIndex !== undefined) {
        e.preventDefault()
        this.applyHistoricalFilter(parseInt(filterIndex))
      }
    })
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
    this._filteredArticole = this._articole.map((item) => ({
      ...item,
      articol: { ...item.articol, visible: true },
      subarticole: item.subarticole.map((sub) => ({ ...sub, visible: true }))
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
    if (!this.mainMask || !this._articole) {
      console.warn('mainMask or _articole not initialized')
      return '<div class="alert alert-warning">Filter not available yet</div>'
    }

    const filterableFields = Object.keys(this.mainMask)
      .filter((key) => this.mainMask[key]?.isFilterable)
      .filter((key) =>
        this._articole.some(
          (item) => item.articol[key] !== undefined || item.subarticole.some((sub) => sub[key] !== undefined)
        )
      )

    if (filterableFields.length === 0) {
      return '<div class="alert alert-info">No filterable fields available</div>'
    }

    return filterableFields
      .map((key) => {
        if (this.mainMask[key].filter === 'filter') {
          return `
            <div class="mb-3">
              <label for="${key}" class="form-label">${this.mainMask[key].label || key}</label>
              <select class="form-select form-select-sm" id="${key}" name="${key}">
                ${this.getFilterOptions(key)}
              </select>
            </div>
          `
        } else {
          return `
            <div class="mb-3">
              <label for="${key}" class="form-label">${this.mainMask[key].label || key}</label>
              <input type="text" class="form-control form-control-sm" list="datalistOptions" id="${key}" name="${key}" placeholder="Cauta...">
              <datalist id="datalistOptions">
                ${this.getFilterOptions(key)}
              </datalist>
            </div>
          `
        }
      })
      .join('')
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

    // Save to history if there are actual filters
    if (Object.keys(filterValues).length > 0) {
      // Don't add if exactly the same filter exists
      if (!this._filterHistory.some((f) => JSON.stringify(f) === JSON.stringify(filterValues))) {
        this._filterHistory = [filterValues, ...this._filterHistory].slice(0, 10) // Keep last 10
        localStorage.setItem('filterHistory', JSON.stringify(this._filterHistory))

        // Update history dropdown content
        const historyList = document.getElementById('filterHistoryList')
        if (historyList) {
          historyList.innerHTML = this._filterHistory
            .map(
              (filter, index) => `
            <li>
              <a class="dropdown-item" href="#" data-filter-index="${index}">
                ${this.formatFilterDescription(filter)}
                <i class="bi bi-x text-danger float-end remove-filter" data-filter-index="${index}"></i>
              </a>
            </li>
          `
            )
            .join('')
        }
      }
    }

    // If no filters are set, show everything
    if (Object.keys(filterValues).length === 0) {
      this._filteredArticole = this._articole.map((item) => ({
        ...item,
        articol: { ...item.articol, visible: true },
        subarticole: item.subarticole.map((sub) => ({ ...sub, visible: true }))
      }))
    } else {
      this._filteredArticole = this._articole.map((item) => {
        // Check article visibility
        const articleVisible = Object.entries(filterValues).every(([key, value]) =>
          item.articol[key]?.toString().toLowerCase().includes(value.toLowerCase())
        )

        // Check subarticole visibility
        const subarticoleVisible = item.subarticole.map((sub) => {
          const subVisible = Object.entries(filterValues).every(([key, value]) =>
            sub[key]?.toString().toLowerCase().includes(value.toLowerCase())
          )
          return { ...sub, visible: subVisible }
        })

        // Article is visible if it matches or any of its subarticole match
        const anySubVisible = subarticoleVisible.some((sub) => sub.visible)

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

  formatFilterDescription(filter) {
    // Create a readable description of the filter
    return Object.values(filter).join(', ')
    //.substring(0, 50) + '...'
  }

  removeFromFilterHistory(index) {
    this._filterHistory = this._filterHistory.filter((_, i) => i !== index)
    localStorage.setItem('filterHistory', JSON.stringify(this._filterHistory))

    // Update history dropdown content
    const historyList = document.getElementById('filterHistoryList')
    if (historyList) {
      historyList.innerHTML = this._filterHistory
        .map(
          (filter, index) => `
        <li>
          <a class="dropdown-item" href="#" data-filter-index="${index}">
            ${this.formatFilterDescription(filter)}
            <i class="bi bi-x text-danger float-end remove-filter" data-filter-index="${index}"></i>
          </a>
        </li>
      `
        )
        .join('')
    }

    this.requestUpdate()
  }

  applyHistoricalFilter(index) {
    // First reset all filters
    this.resetFilter()

    // Then apply the selected historical filter
    const filter = this._filterHistory[index]
    Object.entries(filter).forEach(([key, value]) => {
      const input = document.getElementById(key)
      if (input) input.value = value
    })

    // Finally apply the filter
    this.applyFilter()
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<div class="alert alert-warning p-3" role="alert">No data.</div>`
    }

    const usefullEntityDisplayMask = this.usefullDisplayMask(this.mainMask)
    const usefullEntitySubsDisplayMask = this.usefullDisplayMask(this.subsMask)

    const renderDocumentHeader = () => html`
      <div class="card my-2 ms-4 border-secondary">
        <div class="card-body shadow">
          <div class="row g-1">
            ${Object.entries(this.documentHeader).map(([key, value]) => {
              const displayLabel = this.documentHeaderMask?.[key]?.label || key
              let displayValue = value

              // Handle employee fields
              if (key.toLowerCase().includes('responsabil')) {
                displayValue = this._getEmployeeName(value)
              }
              // Handle dates
              else if (value instanceof Date) {
                displayValue = value.toLocaleDateString('ro-RO')
              }

              return html`
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="form-label text-muted small">${displayLabel}</label>
                    <div class="fw-medium">${displayValue || '-'}</div>
                  </div>
                </div>
              `
            })}
          </div>
        </div>
      </div>
    `

    return html`
      <div class="container-fluid">
        ${this.documentHeader && Object.keys(this.documentHeader).length > 0 ? renderDocumentHeader() : ''}
        <table class="table table-sm is-responsive table-hover" style="font-size: small;">
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

  _handleTitleChange(e) {
    const newTitle = e.target.textContent
    // Trigger title update event/method
    console.log('New title:', newTitle)
  }

  _getEmployeeName(id) {
    if (!this.angajati?.length) return id
    const employee = this.angajati.find((ang) => ang.PRSN == id)
    return employee?.NAME2 || id
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
        const headerContent = hasActions
          ? this.articleActionsBar()
          : usefullEntityDisplayMask[key].label || key

        // Check if there are any values for this key in the cells
        const hasValues = this._articole.some((item) => item.articol[key] !== undefined)

        if (hasValues) {
          headers.push(html`<th colspan="${colspan}">${headerContent}</th>`)
        }
      }
    })

    //add hidden column header "Cantitate" after all the above columns
    headers.push(html`<th class="d-none sendQtyTo">Cantitate</th>`)

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
        <td class="d-none sendQtyTo" contenteditable="true"></td>
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
        <td class="d-none sendQtyTo" contenteditable="true"></td>
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

  articleActionsBar() {
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
                  <a class="dropdown-item" href="#" @click="${() => this.addSub()}">${dropdownItem}</a>
                </li>`
            )}
          </ul>
        </div>
        <div class="col">
          <button type="button" class="btn btn-sm" @click="${(e) => this.saveDocument(e.target)}">
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
            <label class="form-check-label" for="checkboxConfirmare"><i class="bi bi-lock"></i></label>
          </div>
        </div>
        <div class="col pt-1">
          <button type="button" class="btn btn-sm" @click="${(e) => this.sendToActions(e.target)}">
            <i class="bi bi-box-arrow-in-up-right fs-4 text-warning"></i>
          </button>
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
          <button type="button" class="btn btn-sm" @click="${(e) => this.savePack(item, e.target)}">
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

  async saveDocument(htmlElement) {
    console.log('Save document from ', htmlElement, 'articole', this._articole)
  }

  savePack(item) {
    console.log('Save article and subarticles', item)
  }

  saveLineArticle(item, htmlElement, value) {
    console.log('Save line', item, htmlElement, value)
  }

  saveLineSubArticle(item, htmlElement, value) {
    console.log('Save sub', item, htmlElement, value)
  }

  createActionPanel() {
    // Remove any existing panels first
    this.cleanupActionPanel()

    const panel = document.createElement('div')
    panel.style.position = 'fixed'
    panel.style.top = '0'
    panel.style.left = '0'
    panel.style.width = '100%'
    panel.style.zIndex = '1000'
    panel.id = 'sendToPanel'
    panel.className = 'bg-light shadow-sm p-2 d-flex gap-3 align-items-center border-bottom'

    // Add close button
    const closeBtn = document.createElement('button')
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>'
    closeBtn.className = 'btn btn-sm btn-link text-dark ms-auto'
    closeBtn.style.textDecoration = 'none'
    closeBtn.addEventListener('click', () => this.cleanupActionPanel())

    panel.appendChild(closeBtn)
    return panel
  }

  cleanupActionPanel() {
    // Remove existing panel if any
    const existingPanel = document.getElementById('sendToPanel')
    if (existingPanel) {
      existingPanel.remove()

      // Hide quantity columns
      this.hideQuantityColumns()

      // Show all rows that might have been hidden by review
      const hiddenRows = this.querySelectorAll('tr[style*="display: none"]')
      hiddenRows.forEach((row) => {
        row.style.display = ''
      })

      // Clear all warnings
      const warningCells = this.querySelectorAll('.sendQtyTo.text-warning')
      warningCells.forEach((cell) => {
        cell.classList.remove('text-warning')
        cell.removeAttribute('title')
      })
    }
  }

  hideQuantityColumns() {
    const qtyColumns = this.querySelectorAll('.sendQtyTo')
    qtyColumns.forEach((td) => td.classList.add('d-none'))
  }

  sendToActions() {
    // Clear any previously selected items
    this._selectedItems = []

    // Show quantity columns
    const qtyColumns = this.querySelectorAll('.sendQtyTo')
    qtyColumns.forEach((td) => {
      td.classList.remove('d-none')

      // Set default values if empty
      if (!td.textContent.trim()) {
        td.textContent = '0'
      }
    })

    const panel = this.createActionPanel()
    const { group: sendToGroup, select: sendToSelect } = this.createSendToGroup()
    const { group: empGroup, select: empSelect } = this.createEmployeeGroup()
    const { group: dateGroup, fromDate, toDate } = this.createDateGroup()
    const { group: commentGroup, input: commentInput } = this.createCommentGroup()
    const { group: btnGroup, sendBtn, reviewBtn } = this.createActionButtons()

    // Set default dates
    /* const today = new Date().toISOString().split('T')[0]
    fromDate.value = today
    toDate.value = today */

    // First append all groups to the panel in the desired order
    const closeBtn = panel.querySelector('button')
    panel.insertBefore(sendToGroup, closeBtn)
    panel.insertBefore(empGroup, closeBtn)
    panel.insertBefore(dateGroup, closeBtn)
    panel.insertBefore(commentGroup, closeBtn)
    panel.insertBefore(btnGroup, closeBtn)

    // Add a status indicator
    const statusIndicator = document.createElement('div')
    statusIndicator.className = 'ms-3 text-muted'
    statusIndicator.textContent = 'Select quantities and press Review to see selected items'
    panel.insertBefore(statusIndicator, btnGroup)

    // Variable to track visibility state
    let allVisible = true

    // Set up review button click handler
    reviewBtn.addEventListener('click', () => {
      // Clear previous selections
      this._selectedItems = []
      const parentArticlesWithQuantity = new Set()

      if (allVisible) {
        // First pass: identify which parent articles have non-zero quantities
        // (either directly or via their subarticles)
        const qtyColumns = this.querySelectorAll('.sendQtyTo')
        qtyColumns.forEach((td) => {
          const quantity = td.textContent.trim()
          if (quantity && quantity !== '0') {
            const tr = td.closest('tr')

            // If this is an article row with quantity
            if (tr.hasAttribute('data-index')) {
              const index = parseInt(tr.getAttribute('data-index'))
              parentArticlesWithQuantity.add(index)
            }

            // If this is a subarticle row with quantity, mark its parent
            if (tr.classList.contains('subarticle') && tr.hasAttribute('data-parent-index')) {
              const parentIndex = parseInt(tr.getAttribute('data-parent-index'))
              parentArticlesWithQuantity.add(parentIndex)
            }
          }
        })

        // Second pass: highlight empty cells within structures that have quantities
        // and hide rows that don't belong to structures with quantities
        const allRows = this.querySelectorAll('tr[data-index], tr.subarticle')
        allRows.forEach((tr) => {
          if (tr.hasAttribute('data-index')) {
            // This is a parent article row
            const index = parseInt(tr.getAttribute('data-index'))

            if (parentArticlesWithQuantity.has(index)) {
              // Show this article and add it to selected items
              tr.style.display = ''
              const item = this._filteredArticole[index]
              if (item && !this._selectedItems.includes(item)) {
                this._selectedItems.push(item)
              }

              // Check if this article's own quantity is zero
              const qtyCell = tr.querySelector('.sendQtyTo')
              if (qtyCell && (qtyCell.textContent.trim() === '0' || qtyCell.textContent.trim() === '')) {
                // Highlight with warning color to indicate it's part of a selected structure but has zero quantity
                qtyCell.classList.add('text-warning')
                qtyCell.title = 'This item has zero quantity but is part of a selected structure'
              }

              // Also make sure to expand it to show its subarticles
              const toggleIcon = tr.querySelector('i')
              if (toggleIcon && toggleIcon.classList.contains('bi-plus-square')) {
                // Trigger expansion to show subarticles
                this.toggleSubarticles(index)
              }
            } else {
              // Hide this article
              tr.style.display = 'none'
            }
          } else if (tr.classList.contains('subarticle')) {
            // This is a subarticle row
            const parentIndex = parseInt(tr.getAttribute('data-parent-index'))

            if (parentArticlesWithQuantity.has(parentIndex)) {
              // Show this subarticle since its parent has quantity
              tr.style.display = ''
              tr.classList.remove('d-none') // Also remove bootstrap hiding

              // Check if this subarticle's quantity is zero
              const qtyCell = tr.querySelector('.sendQtyTo')
              if (qtyCell && (qtyCell.textContent.trim() === '0' || qtyCell.textContent.trim() === '')) {
                // Highlight with warning color
                qtyCell.classList.add('text-warning')
                qtyCell.title = 'This item has zero quantity but is part of a selected structure'
              }
            } else {
              // Hide this subarticle
              tr.style.display = 'none'
            }
          }
        })

        // Update button text
        reviewBtn.textContent = 'Show All'
      } else {
        // Show all rows again
        const allRows = this.querySelectorAll('tr[data-index], tr.subarticle')
        allRows.forEach((tr) => {
          tr.style.display = ''

          // For subarticles, respect their original state
          if (tr.classList.contains('subarticle')) {
            // Check if parent is expanded
            const parentIndex = parseInt(tr.getAttribute('data-parent-index'))
            const parentRow = this.querySelector(`tr[data-index="${parentIndex}"]`)
            const toggleIcon = parentRow.querySelector('i')

            // If parent is collapsed, keep subarticles hidden
            if (toggleIcon && toggleIcon.classList.contains('bi-plus-square')) {
              tr.classList.add('d-none')
            } else {
              tr.classList.remove('d-none')
            }
          }

          // Remove warning highlights when showing all
          const qtyCell = tr.querySelector('.sendQtyTo')
          if (qtyCell) {
            qtyCell.classList.remove('text-warning')
            qtyCell.removeAttribute('title')
          }
        })

        // Update button text
        reviewBtn.textContent = 'Review'
      }

      // Toggle visibility state
      allVisible = !allVisible

      // Update the status indicator
      const count = this._selectedItems ? this._selectedItems.length : 0
      statusIndicator.textContent = `${count} items selected`

      console.log('Selected items:', this._selectedItems)
    })

    sendBtn.addEventListener('click', () => {
      this.sendTo(sendToSelect.value, empSelect.value, fromDate.value, toDate.value, commentInput.value)
      this.cleanupActionPanel()
    })

    document.body.appendChild(panel)
  }

  createSendToGroup() {
    const group = document.createElement('div')
    group.className = 'd-flex gap-2 align-items-center'

    const label = document.createElement('label')
    label.textContent = 'Send to:'

    const select = document.createElement('select')
    select.className = 'form-select form-select-sm'
    select.style.width = 'auto'

    const options = ['Estimari', 'Planificari', 'Programari']
    options.forEach((opt) => {
      const option = document.createElement('option')
      option.value = opt
      option.textContent = opt
      select.appendChild(option)
    })

    group.append(label, select)
    return { group, select }
  }

  createEmployeeGroup() {
    const group = document.createElement('div')
    group.className = 'd-flex gap-2 align-items-center'

    //Add from label and select
    const labelFrom = document.createElement('label')
    labelFrom.textContent = 'From:'

    const selectFrom = document.createElement('select')
    selectFrom.className = 'form-select form-select-sm'

    const label = document.createElement('label')
    label.textContent = 'For:'

    const select = document.createElement('select')
    select.className = 'form-select form-select-sm'
    select.style.width = 'auto'

    this.angajati.forEach((emp) => {
      const option = document.createElement('option')
      option.value = emp.PRSN
      option.textContent = emp.NAME2
      select.appendChild(option)
      selectFrom.appendChild(option.cloneNode(true))
    })

    group.append(label, select)
    return { group, select }
  }

  createDateGroup() {
    const group = document.createElement('div')
    group.className = 'd-flex gap-2 align-items-center'

    const fromLabel = document.createElement('label')
    fromLabel.textContent = 'From:'

    const fromDate = document.createElement('input')
    fromDate.type = 'date'
    fromDate.className = 'form-control form-control-sm'
    fromDate.style.width = 'auto'

    const toLabel = document.createElement('label')
    toLabel.textContent = 'To:'

    const toDate = document.createElement('input')
    toDate.type = 'date'
    toDate.className = 'form-control form-control-sm'
    toDate.style.width = 'auto'

    group.append(fromLabel, fromDate, toLabel, toDate)
    return { group, fromDate, toDate }
  }

  createCommentGroup() {
    const group = document.createElement('div')
    group.className = 'd-flex gap-2 align-items-center'

    const label = document.createElement('label')
    label.textContent = 'Comment:'

    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'form-control form-control-sm'
    input.style.width = 'auto'

    group.append(label, input)
    return { group, input }
  }

  createActionButtons() {
    const group = document.createElement('div')
    group.className = 'd-flex gap-2'

    // Array to store selected items
    this._selectedItems = []

    const reviewBtn = document.createElement('button')
    reviewBtn.textContent = 'Review'
    reviewBtn.className = 'btn btn-sm btn-outline-secondary'
    let allVisible = true

    reviewBtn.addEventListener('click', () => {
      // Clear previous selections
      this._selectedItems = []

      const qtyColumns = this.querySelectorAll('.sendQtyTo')
      qtyColumns.forEach((td) => {
        const tr = td.closest('tr')
        const quantity = td.textContent.trim()

        if (allVisible) {
          // Hide rows with empty or zero quantity
          if (quantity === '0' || quantity === '') {
            tr.style.display = 'none'
          } else {
            // Get the item associated with this row
            const item = this.getItemFromRow(tr)
            if (item && !this._selectedItems.includes(item)) {
              this._selectedItems.push(item)
            }
          }
        } else {
          // Show all rows
          tr.style.display = ''
        }
      })

      allVisible = !allVisible
      reviewBtn.textContent = allVisible ? 'Review' : 'Show all'
      console.log('Selected items:', this._selectedItems)
    })

    const sendBtn = document.createElement('button')
    sendBtn.textContent = 'Send'
    sendBtn.className = 'btn btn-sm btn-primary'

    group.append(reviewBtn, sendBtn)
    return { group, sendBtn, reviewBtn }
  }

  getItemFromRow(row) {
    // Check if this is an article row
    if (row.hasAttribute('data-index')) {
      const index = parseInt(row.getAttribute('data-index'))
      return this._filteredArticole[index]
    }

    // Check if this is a subarticle row
    if (row.classList.contains('subarticle') && row.hasAttribute('data-parent-index')) {
      const parentIndex = parseInt(row.getAttribute('data-parent-index'))
      const parent = this._filteredArticole[parentIndex]

      // Find the specific subarticle from this row
      // We need to find which subarticle this row represents
      const subarticleRows = Array.from(
        this.querySelectorAll(`tr.subarticle[data-parent-index="${parentIndex}"]`)
      )
      const subarticleIndex = subarticleRows.indexOf(row)

      if (subarticleIndex !== -1 && parent.subarticole[subarticleIndex]) {
        // Return the parent with only this specific subarticle
        return {
          meta: parent.meta,
          articol: parent.articol,
          subarticole: [parent.subarticole[subarticleIndex]]
        }
      }
    }

    return null
  }

  collectItemsWithQuantities() {
    const selectedItems = []
    const processedArticles = new Set()

    // Process all quantity cells
    const qtyColumns = this.querySelectorAll('.sendQtyTo')

    qtyColumns.forEach((td) => {
      const quantity = td.textContent.trim()
      if (quantity && quantity !== '0') {
        const tr = td.closest('tr')

        // Check if this is a subarticle row
        if (tr.classList.contains('subarticle') && tr.hasAttribute('data-parent-index')) {
          const parentIndex = parseInt(tr.getAttribute('data-parent-index'))

          // If we haven't already processed this parent article, add it
          if (!processedArticles.has(parentIndex)) {
            processedArticles.add(parentIndex)
            selectedItems.push(this._filteredArticole[parentIndex])
          }
        }
        // Check if this is an article row
        else if (tr.hasAttribute('data-index')) {
          const index = parseInt(tr.getAttribute('data-index'))

          // If we haven't already processed this article, add it
          if (!processedArticles.has(index)) {
            processedArticles.add(index)
            selectedItems.push(this._filteredArticole[index])
          }
        }
      }
    })

    return selectedItems
  }

  sendTo(destination, employee, fromDate, toDate, comment) {
    // Process the selected items
    if (!this._selectedItems || this._selectedItems.length === 0) {
      // If no items were explicitly selected through review, collect all items with non-zero quantities
      this._selectedItems = this.collectItemsWithQuantities()
    }

    if (this._selectedItems.length === 0) {
      alert('No items selected to send. Please enter quantities first.')
      return
    }

    // Get the quantities for each selected item
    const itemsWithQuantities = this._selectedItems.map((item) => {
      // Create a copy of the item with quantity information
      const itemCopy = { ...item }

      // Find the quantity for this article from the UI
      const articleRow = this.querySelector(`tr[data-index="${this._filteredArticole.indexOf(item)}"]`)
      if (articleRow) {
        const qtyCell = articleRow.querySelector('.sendQtyTo')
        if (qtyCell) {
          itemCopy.quantity = qtyCell.textContent.trim()
          // Clear warning after processing
          qtyCell.classList.remove('text-warning')
          qtyCell.removeAttribute('title')
        }
      }

      // Check quantities for subarticles
      itemCopy.subarticole = item.subarticole.map((sub, idx) => {
        const subCopy = { ...sub }
        // Find the corresponding subarticle row and get its quantity
        const parentIndex = this._filteredArticole.indexOf(item)
        const subarticleRows = Array.from(
          this.querySelectorAll(`tr.subarticle[data-parent-index="${parentIndex}"]`)
        )

        if (subarticleRows[idx]) {
          const subQtyCell = subarticleRows[idx].querySelector('.sendQtyTo')
          if (subQtyCell) {
            subCopy.quantity = subQtyCell.textContent.trim()
            // Clear warning after processing
            subQtyCell.classList.remove('text-warning')
            subQtyCell.removeAttribute('title')
          }
        }

        return subCopy
      })

      return itemCopy
    })
    console.log(
      'Sending to:',
      destination,
      'for employee:',
      employee,
      'from:',
      fromDate,
      'to:',
      toDate,
      'comment:',
      comment
    )
    console.log('Sending items with quantities:', itemsWithQuantities)

    // Here you would implement the actual sending logic
    // For example, making an API call to save these items to the destination system

    if (destination === 'Planificari') {
      const listaPlanificari = tables.my_table7.element.getPlanificariByResponsabili({
        RESPPLAN: 35,
        RESPEXEC: employee
      })
      console.info('Lista planificari:', listaPlanificari)
    }

    // Reset selected items after sending
    this._selectedItems = []
  }
}

export default UI1
