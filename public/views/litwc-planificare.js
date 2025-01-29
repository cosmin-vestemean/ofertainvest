import UI1 from './UI1.js'

export class Planificare extends UI1 {
  constructor() {
    super()
  }

  saveDocument(htmlElement) {
    console.log('header Document', this.documentHeader, 'document', this._articole)
  }
}

export default Planificare

customElements.define('litwc-planificare', Planificare)
