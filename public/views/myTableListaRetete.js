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
              <table class="table">
                <thead>
                  <tr>
                    ${Object.keys(visibleRecipeDisplayMask).map(
                      (key) => html`<th>${visibleRecipeDisplayMask[key].label || key}</th>`
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    ${Object.keys(visibleRecipeDisplayMask).map(
                      (key) => html`<td>${item.articol[key]}</td>`
                    )}
                  </tr>
                  ${item.subarticole.length > 0
                    ? html`
                        <tr>
                          <td colspan="${Object.keys(visibleRecipeDisplayMask).length}">
                            <table class="table">
                              <thead>
                                <tr>
                                  ${Object.keys(visibleRecipeSubsDisplayMask).map(
                                    (key) =>
                                      html`<th>${visibleRecipeSubsDisplayMask[key].label || key}</th>`
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                ${item.subarticole.map(
                                  (sub) => html`
                                    <tr>
                                      ${Object.keys(visibleRecipeSubsDisplayMask).map(
                                        (key) => html`<td>${sub[key]}</td>`
                                      )}
                                    </tr>
                                  `
                                )}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      `
                    : ''}
                </tbody>
              </table>
            `
          )}
        </div>
      `;
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
