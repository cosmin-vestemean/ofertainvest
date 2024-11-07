import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'

class MyTableListaRetete extends LitElement {
  static properties = {
    data: { type: Array }
  }

  constructor() {
    super()
    this.data = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  static styles = css`
  .subarticol {
    padding-left: 20px;
  }
  .foldable {
    cursor: pointer;
  }
  .hidden {
    display: none;
  }
`;

  toggleFold(event) {
    const subarticole = event.target.nextElementSibling;
    if (subarticole) {
      subarticole.classList.toggle('hidden');
    }
  }

  addSubarticol(event) {
    const idReteta = event.target.dataset.idReteta;
    const idArticol = event.target.dataset.idArticol;
    const newSubarticol = {
      object: {
        DENUMIRE_ARTICOL_OFERTA: 'New Subarticol',
        editable: true
      }
    };
    this.data = this.data.map(reteta => {
      if (reteta.id === idReteta) {
        reteta.reteta = reteta.reteta.map(articol => {
          if (articol.object.id === idArticol) {
            articol.children.push(newSubarticol);
          }
          return articol;
        });
      }
      return reteta;
    });
  }

  editSubarticol(event) {
    const idReteta = event.target.dataset.idReteta;
    const idArticol = event.target.dataset.idArticol;
    const idSubarticol = event.target.dataset.idSubarticol;
    const newValue = event.target.textContent;
    this.data = this.data.map(reteta => {
      if (reteta.id === idReteta) {
        reteta.reteta = reteta.reteta.map(articol => {
          if (articol.object.id === idArticol) {
            articol.children = articol.children.map(subarticol => {
              if (subarticol.object.id === idSubarticol) {
                subarticol.object.DENUMIRE_ARTICOL_OFERTA = newValue;
              }
              return subarticol;
            });
          }
          return articol;
        });
      }
      return reteta;
    });
  }

  deleteSubarticol(event) {
    const idReteta = event.target.dataset.idReteta;
    const idArticol = event.target.dataset.idArticol;
    const idSubarticol = event.target.dataset.idSubarticol;
    this.data = this.data.map(reteta => {
      if (reteta.id === idReteta) {
        reteta.reteta = reteta.reteta.map(articol => {
          if (articol.object.id === idArticol) {
            articol.children = articol.children.filter(subarticol => subarticol.object.id !== idSubarticol);
          }
          return articol;
        });
      }
      return reteta;
    });
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<p class="label label-danger">No data</p>`;
    } else {
      return html`
        <table>
          ${this.data.map(reteta => html`
            <tr>
              <td colspan="2"><strong>Reteta ID: ${reteta.id}</strong></td>
            </tr>
            ${reteta.reteta.map(articol => html`
              <tr>
                <td class="foldable" @click="${this.toggleFold}">${articol.object.DENUMIRE_ARTICOL_OFERTA}</td>
                <td>
                  <button @click="${this.addSubarticol}" data-id-reteta="${reteta.id}" data-id-articol="${articol.object.id}">Add Subarticol</button>
                </td>
              </tr>
              <tr class="hidden">
                <td colspan="2">
                  <table class="subarticol">
                    ${articol.children.map(subarticol => html`
                      <tr>
                        <td contenteditable="${subarticol.object.editable}" @blur="${this.editSubarticol}" data-id-reteta="${reteta.id}" data-id-articol="${articol.object.id}" data-id-subarticol="${subarticol.object.id}">
                          ${subarticol.object.DENUMIRE_ARTICOL_OFERTA}
                        </td>
                        ${subarticol.object.editable ? html`
                          <td>
                            <button @click="${this.deleteSubarticol}" data-id-reteta="${reteta.id}" data-id-articol="${articol.object.id}" data-id-subarticol="${subarticol.object.id}">Delete</button>
                          </td>
                        ` : ''}
                      </tr>
                    `)}
                  </table>
                </td>
              </tr>
            `)}
          `)}
        </table>
      `;
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete);

