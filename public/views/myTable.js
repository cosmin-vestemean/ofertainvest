import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { template, theadIsSet } from "../client.js";
import { tables } from '../utils/tables.js';

export class myTable extends LitElement {
  //see https://pwp.stevecassidy.net/javascript/lit/ => custom class myTable -with ds as a reactive propertiy that would trigger a re-render when it changes; uses connectedCallback to set up the initial render
  static properties = {
    ds: { type: Array }
  };

  constructor() {
    super();
    this.tableId = 'my-table';
    this.ds = [];
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  //css
  static styles = css`
    .table td {
      border-bottom: 1px solid #e9ecef;
      border-right: 1px solid #e9ecef;
    }

    .table th {
      font-weight: normal;
      border-right: 1px solid #e9ecef;
    }

    #table_menu_content {
      position: absolute;
      left: 0;
      top: 0;
      padding: 10px;
      border-radius: 5px;
      opacity: 0.9;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    //console.log('my-table element added to the DOM')
  }

  render() {
    console.log('rendering my-table element with following array', this.ds, 'added at', new Date());
    console.log('tableId', this.tableId);

    var my_table_oferta_initiala = tables.my_table1.element
    //if this element has div with id = table_menu_content, remove it
    var table_menu_content = my_table_oferta_initiala.shadowRoot.getElementById('table_menu_content');
    if (table_menu_content) {
      my_table_oferta_initiala.shadowRoot.removeChild(table_menu_content);
    }

    if (!this.ds || this.ds.length == 0) {
      return html`<p class="label label-danger">No data</p>`;
    } else {
      //add table
      var table = document.getElementById('table_' + this.tableId) || document.createElement('table');
      //set font size
      table.style.fontSize = 'small';
      table.classList.add('table');
      table.classList.add('table-sm');
      table.classList.add('table-hover');
      table.classList.add('table-responsive');
      table.id = 'table_' + this.tableId;
      //get or create thead and tbody
      var thead = document.getElementById('thead_' + this.tableId) || document.createElement('thead');
      thead.id = 'thead_' + this.tableId;
      thead.classList.add('align-middle');
      var tbody = document.getElementById('tbody_' + this.tableId) || document.createElement('tbody');
      tbody.id = 'tbody_' + this.tableId;
      tbody.classList.add('table-group-divider');
      table.appendChild(thead);
      table.appendChild(tbody);
      //create a way to handle column visibility
      //1. create a hidden div with id = table_menu_content
      //2. when btn btn_column_filter is clicked, toggle display of table_menu_content
      var table_menu_content = my_table_oferta_initiala.shadowRoot.getElementById('table_menu_content') ||
        document.createElement('div');
      table_menu_content.id = 'table_menu_content';
      //stylish
      table_menu_content.classList.add('bg-dark');
      table_menu_content.classList.add('text-light');
      table_menu_content.classList.add('rounded');
      table_menu_content.classList.add('shadow');
      table_menu_content.style.display = 'none';
      table_menu_content.innerHTML = '';
      //add checkboxes for each column
      var keys = Object.keys(this.ds[0]);
      keys.forEach(function (key) {
        var div = document.createElement('div');
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.id = key;
        input.checked = true;
        div.appendChild(input);
        var label = document.createElement('label');
        label.for = key;
        label.innerHTML = key;
        div.appendChild(label);
        table_menu_content.appendChild(div);
        //add event listener to input
        input.addEventListener('change', function () {
          //toggle display of column
          var index = keys.indexOf(key) + 1; //beacause of counter
          var ths = thead.getElementsByTagName('th');
          var tds = tbody.getElementsByTagName('td');
          if (input.checked) {
            ths[index].style.display = 'table-cell';
            for (var i = index; i < tds.length; i += keys.length) {
              tds[i].style.display = 'table-cell';
            }
          } else {
            ths[index].style.display = 'none';
            for (var i = index; i < tds.length; i += keys.length) {
              tds[i].style.display = 'none';
            }
          }
        });
      });

      //add table_menu_content to my_table_oferta_initiala
      my_table_oferta_initiala.shadowRoot.appendChild(table_menu_content);

      //add thead
      if (theadIsSet) {
        var tr = document.createElement('tr');
        thead.appendChild(tr);
        //append counter
        var th = document.createElement('th');
        th.scope = 'col';
        tr.appendChild(th);
        for (var key in this.ds[0]) {
          var th = document.createElement('th');
          th.scope = 'col';
          th.style.writingMode = 'vertical-rl';
          th.style.rotate = '180deg';
          th.innerHTML = key;
          tr.appendChild(th);
        }
      } else {
        thead.style.display = 'none';
      }

      //add tbody
      let counter = 0;
      this.ds.forEach(function (object) {
        counter++;
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        td.style.fontWeight = 'bold';
        td.innerHTML = counter;
        tr.appendChild(td);
        for (var key in object) {
          var td = document.createElement('td');
          td.innerHTML = typeof object[key] === 'number' ? object[key].toFixed(2) : object[key];
          tr.appendChild(td);
        }
      });

      return html`${table}`;
    }
  }
}
