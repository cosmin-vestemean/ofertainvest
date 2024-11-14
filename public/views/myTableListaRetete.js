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
    this.articole = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.processData();
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

  updated(changedProperties) {
    if (changedProperties.has('data')) {
      this.processData();
    }
  }

  processData() {
    const visibleRecipeDisplayMask = this.visibleDisplayMask(recipeDisplayMask);
    const visibleRecipeSubsDisplayMask = this.visibleDisplayMask(recipeSubsDisplayMask);

    this.articole = [];
    this.data.forEach((reteta) => {
      reteta.reteta.forEach((activitate) => {
        let articol = activitate.object;
        let newArticol = {};

        for (let key in visibleRecipeDisplayMask) {
          if (Object.keys(articol).includes(key)) {
            newArticol[key] = articol[key];
          }
        }

        let newSubarticole = [];
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

        this.articole.push({
          articol: newArticol,
          subarticole: newSubarticole,
          isExpanded: true // default to expanded
        });
      });
    });
  }

  render() {
    if (!this.data || this.data.length == 0) {
      return html`<p class="label label-danger">No data</p>`;
    } else {
      const visibleRecipeDisplayMask = this.visibleDisplayMask(recipeDisplayMask);
      const visibleRecipeSubsDisplayMask = this.visibleDisplayMask(recipeSubsDisplayMask);

      return html`
        <div class="container-fluid">
          ${this.articole.map(
            (item, index) => html`
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>
                      <i
                        class="bi ${item.isExpanded ? 'bi-dash-square' : 'bi-plus-square'}"
                        style="cursor: pointer;"
                        @click="${() => this.toggleSubarticles(index)}"
                      ></i>
                    </th>
                    ${Object.keys(visibleRecipeDisplayMask).map(
                      (key) => html`<th>${visibleRecipeDisplayMask[key].label || key}</th>`
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td></td>
                    ${Object.keys(visibleRecipeDisplayMask).map(
                      (key) => html`<td>${item.articol[key]}</td>`
                    )}
                  </tr>
                  ${item.isExpanded && item.subarticole.length > 0
                    ? html`
                        <tr>
                          <td colspan="${Object.keys(visibleRecipeDisplayMask).length + 1}">
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

  toggleSubarticles = (index) => {
    this.articole[index].isExpanded = !this.articole[index].isExpanded;
    this.requestUpdate();
  };
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
