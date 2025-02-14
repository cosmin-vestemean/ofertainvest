import UI1 from './UI1.js'
import { contextOferta } from '../client.js'
import { upsertDocument } from '../controllers/insertDocInDB.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { convertDBAntemasuratori } from '../controllers/antemasuratori.js'

export class Planificare extends UI1 {
  static get properties() {
    return {
      planificareId: { type: Number },
      data: { type: Array }
    };
  }

  constructor() {
    super();
    this.planificareId = null;
    this.data = [];
  }

  async firstUpdated() {
    if (this.planificareId) {
      await this.loadPlanificareData(this.planificareId);
    }
  }

  async loadPlanificareData(id) {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found');
      return;
    }

    try {
      const response = await client.service('getDataset').find({
        query: {
          sqlQuery: `select * from cccplanificarilinii a
            inner join cccantemasuratori b on (a.cccantemasuratori=b.cccantemasuratori and a.cccoferteweb=b.cccoferteweb)
            inner join cccoferteweblinii c on (b.cccoferteweblinii=c.cccoferteweblinii)
            inner join cccpaths d on (d.cccpaths=b.cccpaths)
            WHERE a.CCCPLANIFICARI = ${id}`
        }
      });

      if (!response.success) {
        console.error('Failed to load planificare details', response.error);
        return;
      }

      this.data = await convertDBAntemasuratori(response.data);
      this.requestUpdate();

    } catch (error) {
      console.error('Error loading planificare details:', error);
    }
  }

  render() {
    return html`
      <div>
        Planificare ID: ${this.planificareId}
        ${this.data ? html`
          <p>Data loaded successfully!</p>
          <!-- Render your data here -->
        ` : html`
          <p>Loading data...</p>
        `}
      </div>
    `;
  }

  async saveDocument(htmlElement) {
    // Add spinner to button
    const originalContent = htmlElement.innerHTML
    htmlElement.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvare...'
    htmlElement.disabled = true

    const idOferta = contextOferta.CCCOFERTEWEB
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
      let articol = item.articol
      // Add main article
      if (articol[_cantitate_planificari] > 0)
        lines.push({
          CCCOFERTEWEB: idOferta,
          CCCANTEMASURATORI: articol.CCCANTEMASURATORI,
          CANTITATE: articol[_cantitate_planificari]
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
      console.warn('Nu am gasit planificari valide')
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

    item[_cantitate_planificari] = nr
    console.log('item', item)
  }

  restorehtmlElement(element, value) {
    element.innerHTML = value
    element.disabled = false
  }
}

export default Planificare

customElements.define('litwc-planificare', Planificare)
