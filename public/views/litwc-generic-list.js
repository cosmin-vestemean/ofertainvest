import { LitElement, html, contextOferta } from '../client.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { employeesService } from '../utils/employeesService.js'

export class LitwcGenericList extends LitElement {
  static properties = {
    items: { type: Array },
    isLoading: { type: Boolean },
    processedItems: { type: Object },
    employees: { type: Array },
    displayMask: { type: Object },  // {planificareDisplayMask, planificareSubsDisplayMask, planificareHeaderMask, listaPlanificariMask}
    itemComponent: { type: String }, // e.g. 'litwc-planificare'
    cantitateField: { type: String }, // e.g. _cantitate_planificari
    stylesheet: { type: String },
    DocumentType: { type: String }, //planificare, estimare, etc.
    dataService: { type: Object },  // e.g. planificariService
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
    if (!document.querySelector(`link[href="../css/${this.stylesheet}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet' 
      link.href = `../css/${this.stylesheet}`
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

  // Generic methods that work with any list type
  async loadItems(forceRefresh = false) {
    if (!contextOferta?.CCCOFERTEWEB) {
        this.showToast('Nu există o ofertă validă selectată', 'warning')
        this.planificari = []
        this.processedPlanificari = {}
        this.requestUpdate()
        return
      }
    
      this.isLoading = true
      try {
        // Pass the forceRefresh parameter to the service
        const result = await this.dataService.getData(contextOferta.CCCOFERTEWEB, forceRefresh)
    
        if (!result.success) {
          this.showToast('Eroare la încărcarea planificărilor', 'danger')
          this.planificari = []
          this.processedPlanificari = {}
          this.requestUpdate()
          return
        }
    
        // Process and transform data for display
        this.planificari = result.data.map((p) => {
          // Add display-friendly properties based on the mask
          const displayItem = { ...p }
          Object.keys(listaPlanificariMask).forEach((key) => {
            if (listaPlanificariMask[key].usefull) {
              displayItem[key] = p[key]
            }
          })
          return displayItem
        })
    
        // Pre-process all planificare details
        await this.preprocessAllPlanificariDetails()
    
        console.info('Loaded planificari:', this.planificari)
    
        // Show appropriate message based on whether it was a forced refresh
        this.showToast(
          forceRefresh 
            ? 'Planificările au fost reîncărcate din baza de date' 
            : 'Planificările au fost încărcate cu succes', 
          'success'
        )
      } catch (error) {
        this.showToast('Eroare la încărcarea planificărilor: ' + error.message, 'danger')
        this.planificari = []
        this.processedPlanificari = {}
      } finally {
        this.isLoading = false
        await this.updateComplete
        this.requestUpdate()
      }
  }

  async preprocessAllItems() {
    // To be implemented by child classes  
  }

  renderItemDetails(item) {
    return html`
      <div class="card-body">
        <${this.itemComponent}
          id="${this.itemComponent}-${item.id}"
          .hasMainHeader=${true}
          .hasSubHeader=${false}
          .canAddInLine=${true}
          .mainMask=${this.displayMask}
          .data=${this.processedItems[item.id] || []}
        ></${this.itemComponent}>
      </div>
    `
  }

  // Other shared methods like showToast(), toggleAllSubarticles(), etc.
}