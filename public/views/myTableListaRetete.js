import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'
import { recipeDisplayMask, recipeSubsDisplayMask } from './masks.js'

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

  visibleDisplayMask = (mask) => {
    let displayMask = {}
    for (let column in mask) {
      if (mask[column].visible) {
        displayMask[column] = mask[column]
      }
    }
    return displayMask
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<p class="label label-danger">No data</p>`;
    } else {
      const visibleRecipeDisplayMask = this.visibleDisplayMask(recipeDisplayMask);
      const visibleRecipeSubsDisplayMask = this.visibleDisplayMask(recipeSubsDisplayMask);

      let articole = [];
      this.data.forEach((reteta) => {
        reteta.reteta.forEach((activitate) => {
          let articol = activitate.object;
          let newArticol = {};
          let newSubarticole = [];

          for (let key in visibleRecipeDisplayMask) {
            if (Object.keys(articol).includes(key)) {
              newArticol[key] = articol[key];
            }
          }

          let subarticole = activitate.children.map((subarticol) => subarticol.object);
          for (let subarticol of subarticole) {
            let newSubarticol = {};
            for (let key in visibleRecipeSubsDisplayMask) {
              if (Object.keys(subarticol).includes(key)) {
                newSubarticol[key] = subarticol[key];
              }
            }
            newSubarticole.push(newSubarticol);
          }

          articole.push({ articol: newArticol, subarticole: newSubarticole });
        });
      });

      console.log('articole', articole);

      return html`
        <div class="container-fluid">
          ${articole.map(
            (item) => html`
              <div>
                <!-- Display articol -->
                ${Object.entries(item.articol).map(
                  ([key, value]) => html`<div>${key}: ${value}</div>`
                )}
                <!-- Display subarticole -->
                ${item.subarticole.map(
                  (sub) => html`
                    <div>
                      ${Object.entries(sub).map(
                        ([key, value]) => html`<div>${key}: ${value}</div>`
                      )}
                    </div>
                  `
                )}
              </div>
            `
          )}
        </div>
      `;
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
