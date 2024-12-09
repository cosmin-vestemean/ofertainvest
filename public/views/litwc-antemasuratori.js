import { template, theadIsSet, LitElement, html } from '../client.js'
import { _cantitate_antemasuratori, _cantitate_oferta } from '../utils/_cantitate_oferta.js'
import {
  ds_antemasuratori,
  newTree,
  setDsAntemasuratoriValue,
  updateAntemasuratoare,
  deleteAntemasuratore
} from '../controllers/antemasuratori.js'
import UI1 from './UI1.js';

export class antemasuratori extends UI1 {
  constructor() {
    super();
    // Constructorul clasei MyTableListaRetete
  }

  // Suprascrie metodele din UI1 sau adaugă metode noi
  /* someMethod() {
    super.someMethod();
    // Implementare specifică pentru MyTableListaRetete
  } */
}

export default antemasuratori;

customElements.define('my-antemasuratori', antemasuratori)