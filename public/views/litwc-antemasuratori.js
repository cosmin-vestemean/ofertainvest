import { template, theadIsSet, LitElement, html, contextOferta } from '../client.js'
import { _cantitate_antemasuratori, _cantitate_oferta } from '../utils/_cantitate_oferta.js'
import { runSQLTransaction, getValFromS1Query } from '../utils/S1.js'
import UI1 from './UI1.js'

export class antemasuratori extends UI1 {
  constructor() {
    super();
    // Constructorul clasei MyTableListaRetete
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
            <i class="bi bi-plus-square text-primary"></i> Adauga articol
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
      </div>
    `
  }

  async saveArticle(item, self) {
    // console.log('saveArticle', item, self)
    const oldInnerHTML = self.innerHTML;
    self.setAttribute('disabled', 'disabled');
    //spinner
    self.innerHTML = `<div class="spinner-border spinner-border-sm text-info" role="status"></div>`;
    let sqlList = [];
    if (item.CCCANTEMASURATORI) {
      // Update existing record in CCCANTEMASURATORI
      const sqlUpdate = `UPDATE CCCANTEMASURATORI SET CCCANTEMASURATORI = ${item.CANTITATE_ARTICOL_ANTEMASURATORI} WHERE CCCANTEMASURATORI = ${item.CCCANTEMASURATORI}`;
      sqlList.push(sqlUpdate);

      // Insert into CCCACTIVITINSTANTE for articol
      // Insert into CCCMATINSTANTE for each subarticol

      const objSqlList = { sqlList: sqlList };
      const response = await runSQLTransaction(objSqlList);
      if (response.success) {
        console.log('Antemasuratori updated successfully', response);
        self.removeAttribute('disabled');
        self.innerHTML = oldInnerHTML;
      } else {
        console.log('Error updating antemasuratori', response);
        self.removeAttribute('disabled');
        self.innerHTML = oldInnerHTML;
        alert('Eroare actualizare antemasuratori');
      }
    } else {
      // Insert new record into CCCANTEMASURATORI
      const sqlInsert = `INSERT INTO CCCANTEMASURATORI (CCCOFERTEWEB, CCCPATHS, CCCINSTANTE, CCCACTIVITINSTANTE, CCCOFERTEWEBLINII, CCCANTEMASURATORI, ISARTOF) VALUES (${item.CCCOFERTEWEB}, ${item.CCCPATHS}, ${item.CCCINSTANTE}, ${item.CCCACTIVITINSTANTE}, ${item.CCCOFERTEWEBLINII}, ${item.CANTITATE_ARTICOL_ANTEMASURATORI}, ${item.ISARTOF})`;
      sqlList.push(sqlInsert);

      const objSqlList = { sqlList: sqlList };
      const response = await runSQLTransaction(objSqlList);
      if (response.success) {
        console.log('Antemasuratori inserted successfully', response);
        self.removeAttribute('disabled');
        self.innerHTML = oldInnerHTML;
      } else {
        console.log('Error inserting antemasuratori', response);
        self.removeAttribute('disabled');
        self.innerHTML = oldInnerHTML;
        alert('Eroare inserare antemasuratori');
      }
    }
  }
}

export default antemasuratori;

customElements.define('my-antemasuratori', antemasuratori)