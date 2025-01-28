import { html, contextOferta } from '../client.js'
import UI1 from './UI1.js'
import { runSQLTransaction, getValFromS1Query } from '../utils/S1.js'

class MyTableListaRetete extends UI1 {
  constructor() {
    super()
    // Constructorul clasei MyTableListaRetete
  }

  // Suprascrie metodele din UI1 sau adaugă metode noi
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
        <div class="col">
          <button type="button" class="btn btn-sm" @click="${() => this.recalculate(item)}">
            <i class="bi bi-calculator text-info"></i> Recalculeaza
          </button>
        </div>
      </div>
    `
  }

  recalculate(item) {
    console.log('Recalculeaza', item)
    // Implement recalculation logic here
  }

  async savePackage(item, htmlElement) {
    console.log('Salveaza', item)

    //make htmlElement disabled and show spinner in it
    const oldInnerHTML = htmlElement.innerHTML
    htmlElement.setAttribute('disabled', 'true')
    htmlElement.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`
    try {
      let sqlList = []

      if (item.articol.CCCRETETE > 0) {
        // Update existing record in CCCRETETE
        let sql = `UPDATE CCCRETETE SET 
          NAME='${item.meta.name}', 
          TYPE='${item.meta.type}' 
          WHERE CCCRETETE=${item.CCCRETETE}`
        sqlList.push(sql)

        // Update CCCACTIVITRETETE for articol
        let sqlActivitate = `UPDATE CCCACTIVITRETETE SET 
          SUMCANTANTE=${item.articol.SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA}, 
          AVGNORMUNITOREMAN=${item.articol.MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA}, 
          SUMOREMAN=${item.articol.SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA},
          WHERE CCCACTIVITRETETE=${item.articol.CCCACTIVITRETETE}`
        sqlList.push(sqlActivitate)

        // Update CCCMATRETETE for each subarticol
        item.subarticole.forEach((subarticol) => {
          let sqlSubarticol = `UPDATE CCCMATRETETE SET 
            CANTTOTAL=${subarticol.CANTITATE_SUBARTICOL_RETETA}, 
            CANTUNIT=${subarticol.CANTITATE_UNITARA_SUBARTICOL_RETETA}, 
            CANTREAL=${subarticol.CANTITATE_REALIZARE_ARTICOL_RETETA}, 
            CANTREALUNIT=${subarticol.CANTITATE_UNITARA_REALIZARE_ARTICOL_RETETA}, 
            NORMUNITMAN=${subarticol.NORMA_UNITARA_ORE_MANOPERA_SUBARTICOL_RETETA}, 
            PONNORMMAN=${subarticol.PONDERE_NORMA_ORE_MANOPERA_SUBARTICOL_RETETA}, 
            TOTALOREMAN=${subarticol.TOTAL_ORE_MANOPERA_SUBARTICOL_RETETA}, 
            WHERE CCCMATRETETE=${subarticol.CCCMATRETETE}`
          sqlList.push(sqlSubarticol)
        })
      } else {
        // Insert new record in CCCRETETE
        const response = await getValFromS1Query(
          'select ISNULL(max(CCCRETETE), 0) + 1 as CCCRETETE from CCCRETETE'
        )
        if (!response.success) {
          console.log('Error getting max(CCCRETETE) from CCCRETETE')
          return
        }
        const maxReteta = parseInt(response.value)
        let sql = `INSERT INTO CCCRETETE (CCCOFERTEWEB, NAME, ID, TYPE) VALUES 
          (${contextOferta.CCCOFERTEWEB}, '${item.meta.name}', ${maxReteta}, '${item.meta.type || 'null'}')`
        sqlList.push(sql)

        // Insert into CCCACTIVITRETETE for articol
        let sqlActivitate = `INSERT INTO CCCACTIVITRETETE (SUMCANTANTE, AVGNORMUNITOREMAN, SUMOREMAN, CCCRETETE, CCCACTIVITRETETE) VALUES
          (${item.articol.SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA}, ${item.articol.MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA}, ${item.articol.SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA}, ${maxReteta}, ${item.articol.CCCACTIVITRETETE})`
        sqlList.push(sqlActivitate)

        //get last CCCACTIVITRETETE, just inserted
        const responseActivitate = await getValFromS1Query(
          'select ISNULL(max(CCCACTIVITRETETE), 0) as CCCACTIVITRETETE from CCCACTIVITRETETE'
        )
        if (!responseActivitate.success) {
          console.log('Error getting max(CCCACTIVITRETETE) from CCCACTIVITRETETE')
          return
        }

        const maxActivitate = parseInt(responseActivitate.value)

        // Insert into CCCMATRETETE for each subarticol
        item.subarticole.forEach((subarticol) => {
          let sqlSubarticol = `INSERT INTO CCCMATRETETE (CANTTOTAL, CANTUNIT, CANTREAL, CANTREALUNIT, NORMUNITMAN, PONNORMMAN, TOTALOREMAN, CCCRETETE, CCCACTIVITRETETE) VALUES
            (${subarticol.CANTITATE_SUBARTICOL_RETETA}, ${subarticol.CANTITATE_UNITARA_SUBARTICOL_RETETA}, ${subarticol.CANTITATE_REALIZARE_ARTICOL_RETETA}, ${subarticol.CANTITATE_UNITARA_REALIZARE_ARTICOL_RETETA}, ${subarticol.NORMA_UNITARA_ORE_MANOPERA_SUBARTICOL_RETETA}, ${subarticol.PONDERE_NORMA_ORE_MANOPERA_SUBARTICOL_RETETA}, ${subarticol.TOTAL_ORE_MANOPERA_SUBARTICOL_RETETA}, ${max}, ${maxActivitate})`
          sqlList.push(sqlSubarticol)
        })
      }

      let objSqlList = { sqlList: sqlList }
      const response = await runSQLTransaction(objSqlList)
      if (response.success) {
        console.log('Recipe saved successfully', response)
      } else {
        console.log('Error saving Recipe', response)
        //make htmlElement enabled and show save button
        alert('Eroare salvare reteta')
      }
    } catch (error) {
      console.log('Error saving article', error)
      //make htmlElement enabled and show save button
      alert('Eroare salvare reteta')
    }
    //make htmlElement enabled and show save button
    htmlElement.removeAttribute('disabled')
    htmlElement.innerHTML = oldInnerHTML
  }
  saveLineArticle(item, htmlElement, value) {
    console.log('Salveaza linie articol', item, htmlElement, value)
    // Implement saveLineArticle logic here
  }

  saveLineSubArticle(item, htmlElement, value) {
    console.log('Salveaza linie subarticol', item, htmlElement, value)
    // Implement saveLineSubArticle logic here
  }
}

export default MyTableListaRetete

customElements.define('my-table-lista-retete', MyTableListaRetete)
