import UI1 from './UI1.js'
import { contextOferta } from '../client.js'
import { upsertDocument } from '../controllers/insertDocInDB.js'
import { _cantitate_estimari } from '../utils/def_coloane.js'

export class Estimare extends UI1 {
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
    // Get document header data
    const { responsabilEstimare, responsabilPlanificare } = this.documentHeader

    // Build header
    const header = {
      CCCOFERTEWEB: idOferta,
      NAME: `Estimare ${new Date().toISOString()}`,
      RESP1: responsabilEstimare,
      RESP2: responsabilPlanificare
    }

    // Build lines
    let lines = []

    // Process main articles and subarticles
    this._articole.forEach((item) => {
      let articol = item.articol
      // Add main article
      if (articol[_cantitate_estimari] > 0)
        lines.push({
          CCCOFERTEWEB: idOferta,
          CCCANTEMASURATORI: articol.CCCANTEMASURATORI,
          CANTITATE: articol[_cantitate_estimari]
        })

      // Add subarticles if they exist
      if (item.subarticole) {
        item.subarticole.forEach((sub) => {
          if (sub[_cantitate_estimari] > 0)
            lines.push({
              CCCOFERTEWEB: idOferta,
              CCCANTEMASURATORI: sub.CCCANTEMASURATORI,
              CANTITATE: sub[_cantitate_estimari]
            })
        })
      }
    })

    if (lines.length === 0) {
      alert('Nu am gasit estimari valide')
      console.warn('Nu am gasit estimari valide')
      this.restorehtmlElement(htmlElement, originalContent)
      return
    }

    try {
      const result = await upsertDocument({
        headerTable: 'CCCESTIMARI',
        header,
        linesTable: 'CCCESTIMARILINII',
        lines,
        upsert: 'insert'
      })

      if (result.success) {
        alert('Document salvat cu succes')
        return result.documentId
      }
    } catch (error) {
      console.error('Error saving estimare:', error)
      alert('Eroare la salvare estimare')
      throw error
    } finally {
      // Restore button state
      this.restorehtmlElement(htmlElement, originalContent)
    }
  }

  saveLineArticle(item, htmlElement, value) {
    this.saveLine(item, htmlElement, value)
  }

  saveLineSubArticle(item, htmlElement, value) {
    this.saveLine(item, htmlElement, value)
  }

  saveLine(item, htmlElement, value) {
    let nr
    try {
      nr = parseFloat(value)
    } catch (error) {
      console.log('error', error)
      alert('Valoare invalida')
      return
    }

    item[_cantitate_estimari] = nr
    console.log('item', item)
  }

  restorehtmlElement(element, value) {
    element.innerHTML = value
    element.disabled = false
  }
}

export default Estimare

customElements.define('litwc-estimare', Estimare)