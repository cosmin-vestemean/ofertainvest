import { planificariService } from '../services/planificariService.js'
import { employeesService } from '../utils/employeesService.js'
import { contextOferta } from '../client.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { tables } from '../utils/tables.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

export class PlanificariController {
  constructor(view) {
    this.view = view
    this.angajati = []
    this.isLoading = true
    this.planificari = []
    this.processedPlanificari = {}
    this.modal = null
  }

  async initialize() {
    try {
      await this.loadEmployees()
      await this.loadPlanificari()
    } catch (error) {
      console.error('Failed to initialize:', error)
      this.view.showToast('Eroare la inițializare', 'danger')
    } finally {
      this.isLoading = false
      this.view.requestUpdate()
    }
  }

  async loadEmployees() {
    if (contextOferta?.angajati?.length > 0) {
      this.angajati = contextOferta.angajati
    } else {
      const employees = await employeesService.loadEmployees()
      if (employees?.length > 0) {
        this.angajati = employees
        contextOferta.angajati = employees
      }
    }
  }

  async loadPlanificari(forceRefresh = false) {
    if (!this.validateContext()) return

    this.isLoading = true
    try {
      const result = await planificariService.getPlanificari(forceRefresh)
      if (!result.success) {
        throw new Error('Eroare la încărcarea planificărilor')
      }

      this.planificari = this.transformPlanificariForDisplay(result.data)
      await this.preprocessAllPlanificariDetails()

      this.view.showToast(
        forceRefresh 
          ? 'Planificările au fost reîncărcate din baza de date' 
          : 'Planificările au fost încărcate cu succes',
        'success'
      )
    } catch (error) {
      this.handleError(error)
    } finally {
      this.isLoading = false
      this.view.requestUpdate()
    }
  }

  transformPlanificariForDisplay(data) {
    return data.map(p => {
      const displayItem = { ...p }
      Object.keys(this.view.listaPlanificariMask).forEach(key => {
        if (this.view.listaPlanificariMask[key].usefull) {
          displayItem[key] = p[key]
        }
      })
      return displayItem
    })
  }

  async preprocessAllPlanificariDetails() {
    const processingPromises = this.planificari.map(async header => {
      try {
        this.processedPlanificari[header.CCCPLANIFICARI] = 
          await planificariService.convertPlanificareData(header.linii)
      } catch (error) {
        console.error(`Error processing planificare ${header.CCCPLANIFICARI}:`, error)
        this.processedPlanificari[header.CCCPLANIFICARI] = []
      }
    })

    await Promise.all(processingPromises)
  }

  validateContext() {
    if (!contextOferta?.CCCOFERTEWEB) {
      this.view.showToast('Nu există o ofertă validă selectată', 'warning')
      this.resetState()
      return false
    }
    return true
  }

  resetState() {
    this.planificari = []
    this.processedPlanificari = {}
  }

  handleError(error) {
    console.error(error)
    this.view.showToast(error.message, 'danger')
    this.resetState()
  }

  async handleNewPlanificare(formData) {
    if (!this.validateNewPlanificare(formData)) return

    try {
      const planificareData = this.preparePlanificareData(formData)
      await this.savePlanificare(planificareData)
      
      this.view.modal?.hide()
      this.view.showToast('Planificare nouă creată cu succes', 'success')
    } catch (error) {
      this.view.showToast('Eroare la crearea planificării: ' + error.message, 'danger')
    }
  }

  validateNewPlanificare(formData) {
    if (formData.includeDates && formData.startDate > formData.endDate) {
      this.view.showToast('Data de început nu poate fi după data de sfârșit', 'warning')
      return false
    }
    if (!ds_antemasuratori?.length) {
      this.view.showToast('Nu există antemăsurători disponibile', 'warning')
      return false
    }
    return this.validateContext()
  }

  preparePlanificareData(formData) {
    const ds_planificareNoua = JSON.parse(JSON.stringify(ds_antemasuratori))
    ds_planificareNoua.forEach(parent => {
      parent.content.forEach(item => {
        item.object[_cantitate_planificari] = 0
        item.children?.forEach(child => {
          child.object[_cantitate_planificari] = 0
        })
      })
    })
    return ds_planificareNoua
  }

  async savePlanificare(planificareData) {
    const table = tables.tablePlanificareCurenta.element
    Object.assign(table, {
      hasMainHeader: true,
      hasSubHeader: false,
      canAddInLine: true,
      mainMask: this.view.planificareDisplayMask,
      subsMask: this.view.planificareSubsDisplayMask,
      data: planificareData,
      documentHeader: {
        responsabilPlanificare: this.view.getFormValue('select1'),
        responsabilExecutie: this.view.getFormValue('select2')
      },
      documentHeaderMask: this.view.planificareHeaderMask
    })

    tables.hideAllBut([tables.tablePlanificareCurenta])
  }
}
