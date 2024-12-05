import UI1 from './UI1.js';

class MyTableListaRetete extends UI1 {
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

export default MyTableListaRetete;

customElements.define('my-table-lista-retete', MyTableListaRetete)