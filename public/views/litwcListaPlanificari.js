import { LitElement, html } from 'lit';

class LitwcListaPlanificari extends LitElement {
  render() {
    return html`
      <button @click="${this.handleAddPlanificare}">Adauga planificare</button>
    `;
  }

  handleAddPlanificare() {
    console.log('Adauga planificare button clicked');
    // Add your logic here
  }
}

export default LitwcListaPlanificari;

customElements.define('litwc-lista-planificari', LitwcListaPlanificari);
