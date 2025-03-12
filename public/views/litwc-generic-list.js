import { LitElement, html, contextOferta } from '../client.js'
import { employeesService } from '../utils/employeesService.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'

/* global bootstrap */

export class LitwcGenericList extends LitElement {
    static properties = {
        // Data properties
        items: { type: Array },
        processedItems: { type: Object },
        employees: { type: Array },

        // UI state
        isLoading: { type: Boolean },

        // Configuration
        displayMask: { type: Object },
        DocumentType: { type: String },
        stylesheet: { type: String },
        denumireCantitate: { type: String },
        idString: { type: String },

        // Component references
        itemComponent: { type: String },
        dataService: { type: Object },
        tableForNewDocument: { type: Object },

        // Labels
        denumireResp1: { type: String },
        denumireResp2: { type: String }
    }

    constructor() {
        super()
        this.items = []
        this.isLoading = true
        this.modal = null
        this.processedItems = {}
        this.employees = []

        this.addStyles()
    }

    addStyles() {
        if (!document.querySelector(`link[href="../styles/${this.stylesheet}"]`)) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = `../styles/${this.stylesheet}`
            document.head.appendChild(link)
        }
    }

    createRenderRoot() {
        return this
    }

    setupEventListeners() {
        this.addEventListener('click', (e) => {
            if (e.target.id === `adauga-${this.DocumentType}`) {
                this.showModal()
            }
        })
    }

    async firstUpdated() {
        try {
            // First check context
            if (contextOferta?.angajati?.length > 0) {
                this.employees = contextOferta.angajati
            } else {
                // If not in context, load and cache
                const employees = await employeesService.loadEmployees()
                if (employees?.length > 0) {
                    this.employees = employees
                    // Cache for other components
                    contextOferta.angajati = employees
                }
            }
        } catch (error) {
            console.error('Failed to load employees:', error)
            this.employees = [] // Ensure we have an empty array
        } finally {
            this.isLoading = false
            this.setupEventListeners()
            this.requestUpdate()
        }
        this.loadItems()
    }

    async loadItems(forceRefresh = false) {
        if (!contextOferta?.CCCOFERTEWEB) {
            this.showToast(`Nu există o ofertă validă selectată`, 'warning')
            this.items = []
            this.processedItems = {}
            this.requestUpdate()
            return
        }

        this.isLoading = true
        try {
            const result = await this.dataService.getData(forceRefresh)

            if (!result.success) {
                this.showToast(`Eroare la încărcarea ${this.DocumentType}`, 'danger')
                this.items = []
                this.processedItems = {}
                this.requestUpdate()
                return
            }

            // Process and transform data for display
            this.items = result.data.map((item) => {
                const displayItem = { ...item }
                Object.keys(this.displayMask).forEach((key) => {
                    if (this.displayMask[key].usefull) {
                        displayItem[key] = item[key]
                    }
                })
                return displayItem
            })

            // Pre-process all item details
            await this.preprocessAllItems()

            console.info(`Loaded ${this.DocumentType}:`, this.items)

            this.showToast(
                forceRefresh
                    ? `${this.DocumentType} au fost reîncărcate din baza de date`
                    : `${this.DocumentType} au fost încărcate cu succes`,
                'success'
            )
        } catch (error) {
            this.showToast(`Eroare la încărcarea ${this.DocumentType}: ${error.message}`, 'danger')
            this.items = []
            this.processedItems = {}
        } finally {
            this.isLoading = false
            await this.updateComplete
            this.requestUpdate()
        }
    }

    async preprocessAllItems() {
        try {
            const processingPromises = this.items.map(async (header) => {
                try {
                    const convertedData = await this.dataService.convertData(header.linii)
                    this.processedItems[header.id] = convertedData
                } catch (error) {
                    console.error(`Error pre-processing ${this.DocumentType} ${header.id}:`, error)
                    this.processedItems[header.id] = []
                }
            })

            await Promise.all(processingPromises)
            this.showToast('Datele au fost procesate cu succes', 'success')
        } catch (error) {
            this.showToast('Eroare la procesarea datelor: ' + error.message, 'danger')
        }
    }

    showModal() {
        if (!this.modal) {
            this.modal = new bootstrap.Modal(document.getElementById(`${this.DocumentType}Modal`), {
                keyboard: true,
                backdrop: false
            })
        }
        this.modal.show()
    }

    validateDates() {
        const startDate = document.getElementById('startDate').value
        const endDate = document.getElementById('endDate').value

        if (new Date(startDate) > new Date(endDate)) {
            this.showToast('Data de început nu poate fi după data de sfârșit', 'warning')
            return false
        }

        return true
    }

    async handleNewItem() {
        if (!this.validateDates()) {
            this.showToast('Vă rugăm să selectați datele corect', 'warning')
            return
        }
        if (!ds_antemasuratori?.length) {
            this.showToast('Nu există antemăsurători disponibile', 'warning')
            return
        }

        if (!contextOferta?.CCCOFERTEWEB) {
            this.showToast('Nu există o ofertă validă selectată', 'warning')
            return
        }

        try {
            let newItem = JSON.parse(JSON.stringify(ds_antemasuratori))
            newItem.forEach((parent) => {
                parent.content.forEach((item) => {
                    item.object[this.denumireCantitate] = 0
                    item.children?.forEach((child) => {
                        child.object[this.denumireCantitate] = 0
                    })
                })
            })

            const table = this.tableForNewDocument
            Object.assign(table, {
                hasMainHeader: true,
                hasSubHeader: false,
                canAddInLine: true,
                mainMask: this.displayMask.mainMask,
                subsMask: this.displayMask.subsMask,
                data: newItem,
                documentHeader: {
                    responsabilPlanificare: document.getElementById('select1').value,
                    responsabilExecutie: document.getElementById('select2').value
                },
                documentHeaderMask: this.displayMask.documentHeaderMask
            })

            tables.hideAllBut([this.tableForNewDocument])
            this.modal?.hide()
            this.showToast(`${this.DocumentType} a fost creată cu succes`, 'success')
        } catch (error) {
            this.showToast(`Eroare la creare ${this.DocumentType}: ${error.message}`, 'danger')
        }
    }

    async openItem(id, table, hideAllBut = true) {
        if (!contextOferta?.CCCOFERTEWEB) {
            this.showToast('Nu există o ofertă validă selectată', 'warning')
            return
        }
    
        try {
            const header = this.items.find((i) => i[this.idString] === id)
            if (!header) {
                console.error(`Failed to find ${this.DocumentType} header`)
                return
            }
    
            const itemData = this.processedItems[id] || []
    
            Object.assign(table, {
                hasMainHeader: true,
                hasSubHeader: false,
                canAddInLine: true,
                mainMask: this.displayMask.mainMask,
                subsMask: this.displayMask.subsMask,
                data: itemData,
                documentHeader: {
                    responsabilPlanificare: header.RESP1,
                    responsabilExecutie: header.RESP2,
                    id: header[this.idString]
                },
                documentHeaderMask: this.displayMask.documentHeaderMask
            })
    
            if (hideAllBut) tables.hideAllBut([this.tableForNewDocument])
            this.showToast(`${this.DocumentType} deschis cu succes`, 'success')
        } catch (error) {
            this.showToast(`Eroare la deschiderea ${this.DocumentType}: ${error.message}`, 'danger')
        }
    }

    getItemsByResponsabili({ RESP1, RESP2 } = {}) {
        if (!this.items?.length) {
            return []
        }
      
        return this.items.filter((item) => {
            return (
                (!RESP1 || item.RESP1 === RESP1) && 
                (!RESP2 || item.RESP2 === RESP2)
            )
        })
    }

    renderEmployeeSelect(id, label) {
        return html`
      <div class="mb-3">
        <label for="${id}" class="form-label">${label}</label>
        <select class="form-select" id="${id}">
          ${this.employees.map((employee) => html`
            <option value="${employee.PRSN}">${employee.NAME2}</option>
          `)}
        </select>
      </div>
    `
    }

    showToast(message, type = 'info') {
        requestAnimationFrame(() => {
            let toastContainer = this.querySelector('#toast-container')

            if (!toastContainer) {
                toastContainer = document.createElement('div')
                toastContainer.id = 'toast-container'
                toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3'
                this.appendChild(toastContainer)
            }

            const toastEl = document.createElement('div')
            toastEl.className = `toast align-items-center text-white bg-${type} border-0`
            toastEl.setAttribute('role', 'alert')
            toastEl.setAttribute('aria-live', 'assertive')
            toastEl.setAttribute('aria-atomic', 'true')

            toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `

            toastContainer.appendChild(toastEl)
            const toast = new bootstrap.Toast(toastEl)
            toast.show()

            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove())
        })
    }

    renderModal() {
        return html`
    <div class="modal" id="${this.DocumentType}Modal" tabindex="-1">
      <div role="dialog" class="modal-dialog modal-dialog-scrollable modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Adaugă ${this.DocumentType}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-check form-switch mb-3">
                <input class="form-check-input" type="checkbox" id="showDates" 
                  @change="${(e) => {
                    const dateFields = this.querySelector('.date-fields');
                    dateFields.style.display = e.target.checked ? 'block' : 'none';
                  }}">
                <label class="form-check-label" for="showDates">Include date</label>
              </div>
              
              <div class="date-fields" style="display: none">
                <div class="mb-3">
                  <label for="startDate" class="form-label">Data început</label>
                  <input type="date" class="form-control" id="startDate" />
                </div>
                <div class="mb-3">
                  <label for="endDate" class="form-label">Data sfârșit</label>
                  <input type="date" class="form-control" id="endDate" />
                </div>
              </div>

              ${this.renderEmployeeSelect('select1', this.denumireResp1)}
              ${this.renderEmployeeSelect('select2', this.denumireResp2)}
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Închide</button>
            <button type="button" class="btn btn-primary" @click="${() => this.handleNewItem()}">
              ${this.DocumentType} nou
            </button>
          </div>
        </div>
      </div>
    </div>
  `
    }

    render() {
        if (this.isLoading) {
            return html`
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      `
        }

        return html`
      <div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3"></div>

      <div class="toolbar d-flex align-items-center mb-3 p-2 bg-light border rounded shadow-sm">
        <div class="btn-group me-auto" role="group" aria-label="Basic actions">
          <button type="button" class="btn btn-primary btn-sm" 
            id="adauga-${this.DocumentType}" 
            title="Adaugă ${this.DocumentType} nou">
            <i class="bi bi-plus-lg me-1"></i> 
            Adaugă ${this.DocumentType}
          </button>
        </div>
        
        <div class="btn-group me-2" role="group" aria-label="Data operations">
          <button type="button" class="btn btn-outline-secondary btn-sm" 
            @click="${() => this.loadItems()}" 
            title="Reîncarcă din cache">
            <i class="bi bi-arrow-clockwise"></i> Refresh
          </button>
          <button type="button" class="btn btn-outline-warning btn-sm" 
            @click="${() => this.loadItems(true)}" 
            title="Reîncarcă din baza de date">
            <i class="bi bi-cloud-download"></i> Force Refresh
          </button>
        </div>

        <div class="btn-group" role="group" aria-label="Display options">
          <button type="button" class="btn btn-outline-info btn-sm" 
            @click="${() => this.toggleAllSubarticles()}" 
            title="Expandează sau restrânge toate secțiunile">
            <i class="bi bi-arrows-expand"></i> Expand/Collapse
          </button>
        </div>
      </div>

      <div class="items-stack">
        ${this.items.map((item, index) => html`
          <div class="item-card">
            <div class="card-header">
              <div class="card-header-content">
                <div class="header-item">
                  <span class="text-info mx-2">#${index + 1}</span>
                </div>
                ${Object.entries(this.displayMask)
                .filter(([_, props]) => props.visible)
                .map(([key, props]) => html`
                    <div class="header-item">
                      <span class="text-muted">${props.label}:</span>
                      <span class="text-info">${item[key]}</span>
                    </div>
                  `)}
                <button type="button" class="btn btn-outline-primary btn-sm m-1"
                  @click="${() => this.openItem(item[this.idString], this.tableForNewDocument.element)}">
                  <i class="bi bi-arrows-fullscreen"></i>
                </button>
              </div>
            </div>
            ${this.renderItemDetails(item)}
          </div>
        `)}
      </div>
    `
    }

    renderItemDetails(item) {
        const header = this.items.find((i) => i[this.idString] === item[this.idString])
        if (!header) return null

        const itemData = this.processedItems[item[this.idString]] || []

        return html`
            <div class="card-body">
                <${this.itemComponent}
                    id="${this.itemComponent}-${item[this.idString]}"
                    .hasMainHeader=${true}
                    .hasSubHeader=${false}
                    .canAddInLine=${true}
                    .mainMask=${this.displayMask.mainMask}
                    .subsMask=${this.displayMask.subsMask}
                    .data=${itemData}
                ></${this.itemComponent}>
            </div>
        `
    }

    toggleAllSubarticles() {
        const itemComponents = this.querySelectorAll(this.itemComponent);
        let shouldExpand = true;

        const anyExpanded = Array.from(itemComponents).some(component =>
          component.querySelector('.bi-dash-square')
        );

        shouldExpand = !anyExpanded;

        itemComponents.forEach(component => {
          const parentRows = component.querySelectorAll('tr[data-index]');

          parentRows.forEach(row => {
            const index = row.getAttribute('data-index');
            const toggleIcon = row.querySelector('i');

            if (!toggleIcon) return;

            const hasSubarticles = toggleIcon.classList.contains('bi-plus-square') ||
              toggleIcon.classList.contains('bi-dash-square');

            if (hasSubarticles) {
              const isExpanded = toggleIcon.classList.contains('bi-dash-square');
              if ((shouldExpand && !isExpanded) || (!shouldExpand && isExpanded)) {
                component.toggleSubarticles(parseInt(index));
              }
            }
          });
        });
    }
}