import UI1 from './UI1.js'
import { contextOferta } from '../client.js'
import { upsertDocument } from '../controllers/insertDocInDB.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

export class Planificare extends UI1 {
  constructor() {
    super()
  }

  async saveDocument(htmlElement) {
    // Add spinner to button
    const originalContent = htmlElement.innerHTML
    htmlElement.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvare...'
    htmlElement.disabled = true

    const idOferta = contextOferta.CCCOFERTEWEB
    console.log('header document', this.documentHeader, 'linii document', this._articole, 'oferta', idOferta)
    // Get document header data
    const { startDate, endDate, responsabilPlanificare, responsabilExecutie } = this.documentHeader

    // Build header
    const header = {
      CCCOFERTEWEB: idOferta,
      NAME: `Planificare ${new Date().toISOString()}`,
      DATASTART: startDate,
      DATASTOP: endDate,
      RESPPLAN: responsabilPlanificare,
      RESPEXEC: responsabilExecutie
    }

    // Build lines
    const lines = []

    // Process main articles and subarticles
    this._articole.forEach((item) => {
      // Add main article
      if (item[_cantitate_planificari] > 0)
        lines.push({
          CCCOFERTEWEB: idOferta,
          CCCANTEMASURATORI: item.CCCANTEMASURATORI,
          CANTITATE: item[_cantitate_planificari]
        })

      // Add subarticles if they exist
      if (item.subarticole) {
        item.subarticole.forEach((sub) => {
          if (sub[_cantitate_planificari] > 0)
            lines.push({
              CCCOFERTEWEB: idOferta,
              CCCANTEMASURATORI: sub.CCCANTEMASURATORI,
              CANTITATE: sub[_cantitate_planificari]
            })
        })
      }
    })

    if (lines.length === 0) {
      alert('Nu am gasit planificari valide')
      console.warn('No valid planificari found')
      this.restorehtmlElement(htmlElement, originalContent)
      return
    }

    try {
      const result = await upsertDocument({
        headerTable: 'CCCPLANIFICARI',
        header,
        linesTable: 'CCCPLANIFICARILINII',
        lines,
        upsert: 'insert'
      })

      if (result.success) {
        alert('Document salvat cu succes')
        return result.documentId
      }
    } catch (error) {
      console.error('Error saving document:', error)
      alert('Eroare la salvare document')
      throw error
    } finally {
      // Restore button state
      this.restorehtmlElement(htmlElement, originalContent)
    }
  }

  saveLineArticle(item, htmlElement, value) {
    let nr
    try {
      nr = parseFloat(value)
    } catch (error) {
      console.log('error', error)
      alert('Valoare invalida')
      return
    }

    item[_cantitate_planificari] = nr
  }

  saveLineSubArticle(item, htmlElement, value) {
    this.saveLineArticle(item, htmlElement, value)
  }

  saveLine(item, htmlElement, value) {
    this.saveLineArticle(item, htmlElement, value)
  }

  restorehtmlElement(element, value) {
    element.innerHTML = value
    element.disabled = false
  }
}

export default Planificare

customElements.define('litwc-planificare', Planificare)
