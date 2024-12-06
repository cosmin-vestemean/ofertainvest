import { theadIsSet, LitElement, html, unsafeHTML } from '../client.js'

class UI1 extends LitElement {
  static properties = {
    data: { type: Array },
    dropdownItems: { type: Array },
    mainMask: { type: Object },
    subsMask: { type: Object },
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

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<div class="alert alert-warning" role="alert">No data.</div>`
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

      console.log('articole', this.articole)

      const headers = this.generateHeaders(usefullEntityDisplayMask, usefullEntitySubsDisplayMask)

      return html`
        <div class="container-fluid">
          <table class="table table-sm is-responsive table-hover ms-3" style="font-size: small;">
            <thead>
              <tr>
                ${headers}
              </tr>
            </thead>
            ${this.articole.map(
              (item, index) =>
                html`<tbody>
                  ${this.renderArticleRow(
                    item,
                    index,
                    usefullEntityDisplayMask,
                    usefullEntitySubsDisplayMask
                  )}
                </tbody>`
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
    const headers = [html`<th rowspan="2"></th>`]

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
        headers.push(html`<th colspan="${colspan}">${headerContent}</th>`)
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
        @mouseover="${(e) => this.handleMouseOver(e, item)}"
      >
        <td>
          ${item.subarticole.length > 0
            ? html`<i
                class="bi bi-plus-square"
                style="cursor: pointer;"
                @click="${() => this.toggleSubarticles(index)}"
              ></i>`
            : html`<div class="dropdown col" @mouseenter="${(e) => this.handleMouseOverSingleArticol(e, item)}" @mouseleave="${(e) => this.handleMouseLeaveSingleArticol(e, item)}">
                <button
                  class="btn btn-sm dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="bi bi-plus-square text-primary"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-start">
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
            return html`<td
              colspan="${colspan}"
              contenteditable="${usefullEntityDisplayMask[key].RW}"
              class="${zoneClass}"
              @focusin="${(e) => this.handleFocusIn(e, item, key)}"
              @focusout="${(e) => this.saveArticle(item)}"
              @keydown="${(e) => this.handleKeyDown(e, item, key)}"
            >
              ${item.articol[key]}
            </td>`
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
      ${item.subarticole.map((sub) =>
        this.renderSubarticleRow(item, sub, index, usefullEntityDisplayMask, usefullEntitySubsDisplayMask)
      )}
    `
  }

  handleMouseOver(event, item) {
    if (!item.subarticole.length) return
    const tr = event.target.closest('tr')
    if (tr && !tr.dataset.popoverShown) {
      tr.dataset.popoverShown = true
      const isArtOfCount = item.subarticole.filter((sub) => sub.ISARTOF === 1).length || 0
      const totalSubCount = item.subarticole.length
      const popoverContent = `
        <span class="badge text-bg-info">${totalSubCount}</span>
        <span class="badge text-bg-warning">${isArtOfCount}</span>
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
  }

  handleMouseOverSingleArticol(event, item) {
    const dropdown = event.target.closest('.dropdown');
    if (dropdown) {
      dropdown.classList.remove('d-none');
    }
  }

  handleMouseLeaveSingleArticol(event, item) {
    const dropdown = event.target.closest('.dropdown');
    if (dropdown) {
      dropdown.classList.add('d-none');
    }
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
                return html`<td
                  contenteditable="${usefullEntitySubsDisplayMask[subKey].RW}"
                  class="${zoneClass}"
                  @focusin="${(e) => this.handleFocusIn(e, sub, subKey)}"
                  @focusout="${(e) => this.saveArticle(sub)}"
                  @keydown="${(e) => this.handleKeyDown(e, sub, subKey)}"
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
            <i class="bi bi-plus-square text-primary"></i> Adauga subarticol
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
            <i class="bi bi-save text-info"></i> Salveaza reteta
          </button>
        </div>
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

export default UI1;
