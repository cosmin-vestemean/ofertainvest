import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { template, theadIsSet, recipeDisplayMask, retetaCurenta, _nivel_oferta, activitateCurenta } from "./client.js";

//create a <recipe> element
//this element is composed from activities and their children as materials
//a receipe has a name and a list of activities
//each activity has a list of materials named children
/*
this is an activity data:
{
    "branch": [
        "1183",
        "7",
        "18",
        "23"
    ],
    "object": {
        "WBS": "1183.7.18.23",
        "DENUMIRE_ARTICOL_OFERTA": "TROTUAR DIN DALE...100 X 100 X 10 CM,BETON SIMPLU C10/8(B 150) TURNATE PE LOC FARA SCLIV PE STRAT NISIP PILONAT 10 CM, ROSTURI UMPLUTE",
        "CANTITATE_ARTICOL_OFERTA": 8.7312,
        "UM_ARTICOL_OFERTA": "mp"
        "TIP_ARTICOL_OFERTA": "ARTICOL",
        "SUBTIP_ARTICOL_OFERTA": "PRINCIPAL"
    },
    "children": [
        {
            "branch": [
                "1183",
                "7",
                "18",
                "23",
                "5"
            ],
            "object": {
                "WBS": "1183.7.18.23.5",
                "DENUMIRE_ARTICOL_OFERTA": "NISIP SORTAT NESPALAT DE RAU SI LACURI 0,0-3,0 MM",
                "CANTITATE_ARTICOL_OFERTA": 8.7312,
                "UM_ARTICOL_OFERTA": "mc",
                "TIP_ARTICOL_OFERTA": "SUBARTICOL",
                "SUBTIP_ARTICOL_OFERTA": "MATERIAL",
            },
            "level": 5,
            "hasChildren": false,
            "virtual": false
        },
        {
            "branch": [
                "1183",
                "7",
                "18",
                "23",
                "6"
            ],
            "object": {
                "WBS": "1183.7.18.23.6",
                "DENUMIRE_ARTICOL_OFERTA": "SARMA OTEL MOALE, NEAGRA, D = 1 MM",
                "CANTITATE_ARTICOL_OFERTA": 2.856,
                "UM_ARTICOL_OFERTA": "kg",
                "TIP_ARTICOL_OFERTA": "SUBARTICOL",
                "SUBTIP_ARTICOL_OFERTA": "MATERIAL"
            },
            "level": 5,
            "hasChildren": false,
            "virtual": false
        },
        {
            "branch": [
                "1183",
                "7",
                "18",
                "23",
                "7"
            ],
            "object": {
                "WBS": "1183.7.18.23.7",
                "DENUMIRE_ARTICOL_OFERTA": "APA INDUSTRIALA PENTRU MORTARE SI BETOANE DE LA RETEA",
                "CANTITATE_ARTICOL_OFERTA": 0.1632,
                "UM_ARTICOL_OFERTA": "mc",
                "TIP_ARTICOL_OFERTA": "SUBARTICOL",
                "SUBTIP_ARTICOL_OFERTA": "MATERIAL",
            },
            "level": 5,
            "hasChildren": false,
            "virtual": false
        }
    ],
    "level": 4,
    "hasChildren": true,
    "virtual": false
}
*/
export class Recipe extends LitElement {
  static properties = {
    reteta: { type: Array }
  };

  constructor() {
    super();
    this.reteta = [];
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('recipe element added to the DOM');
  }

  render() {
    console.log('rendering recipe element with following array', this.reteta, 'added at', new Date());

    if (!this.reteta || this.reteta.length == 0) {
      return html`<p class="label label-danger">No data</p>`;
    } else {
      //add table
      //evidenteaza activitatea de materiale si activitatile intre ele
      var table = document.createElement('table');
      table.style.fontSize = 'small';
      table.classList.add('table');
      table.classList.add('table-sm');
      table.id = 'table_reteta';
      //get or create thead and tbody
      var thead = document.createElement('thead');
      thead.id = 'thead_reteta';
      thead.classList.add('align-middle');
      var tbody = document.createElement('tbody');
      tbody.id = 'tbody_reteta';
      if (theadIsSet) {
        tbody.classList.add('table-group-divider');
      }
      table.appendChild(tbody);
      //add thead
      //a se tine cont de theadIsSet
      if (theadIsSet) {
        table.appendChild(thead);
        var tr = document.createElement('tr');
        thead.appendChild(tr);
        //append counter
        var th = document.createElement('th');
        th.scope = 'col';
        tr.appendChild(th);
        for (let [key, value] of Object.entries(recipeDisplayMask)) {
          let label = value.label;
          let visible = value.visible;
          let th = document.createElement('th');
          if (!visible) {
            th.classList.add('d-none');
          }
          th.scope = 'col';
          th.innerHTML = label ? label : key;
          th.style.writingMode = 'vertical-rl';
          th.style.rotate = '180deg';
          th.style.fontWeight = 'normal';
          tr.appendChild(th);
        }
      }
      //add tbody
      //first add a row for actions
      var tr = document.createElement('tr');
      tbody.appendChild(tr);
      var td = document.createElement('td');
      td.colSpan = 8;
      tr.appendChild(td);
      //add icon for plus
      var plus_icon = document.createElement('i');
      plus_icon.classList.add('bi');
      plus_icon.classList.add('bi-plus-square', 'text-primary', 'fs-4', 'mb-3');
      plus_icon.style.cursor = 'pointer';
      plus_icon.onclick = function () {
        //modal with my-activity
        var popup = document.getElementById('ModalGeneric');
        var genericContainer = document.getElementById('genericContainer');
        genericContainer.classList.remove('modal-lg');
        genericContainer.classList.add('modal-fullscreen');
        var modal = new bootstrap.Modal(popup);
        var modal_body = document.getElementById('modal-body3');
        modal_body.innerHTML = '';
        var my_activity = document.createElement('my-activity');
        my_activity.id = 'adaugare_activitate';
        //creaza o activitate noua in aceasi reteta
        //has branch, object, children, hasChildren = false, isMain = false, virtual = false, (level = reteta > find reteta.object.isMain object's level)
        //adauga activitatea la reteta
        //adauga activitatea la my_activity
        //find the main activity
        let mainActivity = retetaCurenta.reteta.find((o) => o.isMain);
        if (!mainActivity) {
          console.log('Activitatea principala nu a fost gasita');
          return;
        } else {
          console.log('Activitatea principala', mainActivity);
        }
        let level = mainActivity.object.level;
        let activitateNoua = {
          branch: mainActivity.branch,
          object: {
            WBS: '',
            DENUMIRE_ARTICOL_OFERTA: 'Denumire activitate noua',
            CANTITATE_ARTICOL_OFERTA: 0,
            UM_ARTICOL_OFERTA: '',
            TIP_ARTICOL_OFERTA: '',
            SUBTIP_ARTICOL_OFERTA: '',
            CANTITATE_UNITARA_ARTICOL_RETETA: 1,
            PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA: 1,
            PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA: 1
          },
          children: [],
          hasChildren: false,
          isMain: false,
          virtual: false,
          level: level
        };
        //adauga niveluri oferta/antemasuratori
        for (let [key, value] of Object.entries(mainActivity.object)) {
          if (key.includes(_nivel_oferta)) {
            activitateNoua.object[key] = value;
          }
        }
        //add it to reteta
        retetaCurenta.reteta.push(activitateNoua);
        activitateCurenta = activitateNoua;
        my_activity.activitate = activitateCurenta;
        //id
        my_activity.id = 'editare_activitate';
        modal_body.appendChild(my_activity);
        modal.show();
      };
      td.appendChild(plus_icon);
      //adauga pictograma ascunde/arata toate materiale <=> td with class='material' > display none/block
      var material_icon = document.createElement('i');
      material_icon.classList.add('bi');
      material_icon.classList.add('bi-eye-slash', 'text-primary', 'fs-4', 'mb-3');
      material_icon.style.cursor = 'pointer';
      material_icon.style.marginLeft = '5px';
      material_icon.onclick = function () {
        var tbody = document
          .getElementById('my_table_detalii_reteta')
          .shadowRoot.getElementById('tbody_reteta');
        var tds = tbody.getElementsByTagName('td');
        for (let i = 0; i < tds.length; i++) {
          if (tds[i].classList.contains('material')) {
            if (tds[i].style.display === 'none') {
              tds[i].style.display = 'table-cell';
            } else {
              tds[i].style.display = 'none';
            }
          }
        }
      };
      td.appendChild(material_icon);
      let counter = 0;
      for (let i = 0; i < this.reteta.length; i++) {
        let activitate = this.reteta[i];
        let isActivitatePrincipala = activitate.isMain;
        counter++;
        var tr = document.createElement('tr');
        tr.classList.add('shadow-sm', 'bg-light');
        tbody.appendChild(tr);
        var td = document.createElement('td');
        td.style.fontWeight = 'bold';
        //add fixed width to td
        td.style.width = '80px';
        var edit = document.createElement('i');
        edit.classList.add('bi', 'bi-pencil-square', 'text-primary');
        edit.id = 'edit_' + counter;
        edit.style.cursor = 'pointer';
        edit.onclick = function () {
          //edit activitate
          //ModalGeneric + modal_body3 > my-activity with activitate
          //add class fullscreen
          var popup = document.getElementById('ModalGeneric');
          var genericContainer = document.getElementById('genericContainer');
          genericContainer.classList.remove('modal-lg');
          genericContainer.classList.add('modal-fullscreen');
          var modal = new bootstrap.Modal(popup);
          var modal_body = document.getElementById('modal-body3');
          modal_body.innerHTML = '';
          var my_activity = document.createElement('my-activity');
          my_activity.id = 'editare_activitate';
          activitateCurenta = activitate;
          my_activity.activitate = activitate;
          modal_body.appendChild(my_activity);
          modal.show();
        };
        var trash = document.createElement('i');
        trash.classList.add('bi', 'bi-trash', 'text-danger');
        trash.id = 'trash_' + counter;
        trash.style.cursor = 'pointer';
        trash.style.marginLeft = '5px';
        trash.onclick = function () { };
        td.appendChild(edit);
        td.appendChild(trash);
        //activitate principala as as checkbox indiferent de stare
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'checkbox_' + counter;
        checkbox.classList.add('form-check-input');
        checkbox.classList.add('activitati_reteta');
        checkbox.checked = isActivitatePrincipala;
        checkbox.style.marginLeft = '5px';
        //onchange, set activitate.isMain = checkbox.checked
        checkbox.onchange = function () {
          //unchecked all checkboxes from activitati_reteta; keep in mind shadowRoot of 'table_reteta
          var checkboxes = document
            .getElementById('my_table_detalii_reteta')
            .shadowRoot.getElementById('tbody_reteta')
            .getElementsByClassName('activitati_reteta');
          for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].id !== this.id) {
              checkboxes[i].checked = false;
              //find object in retetaCurenta[i] and set isMain = false
              var a = retetaCurenta.reteta[i];
              if (a) {
                a.isMain = false;
              }
            }
          }
          activitate.isMain = this.checked;
        };
        td.appendChild(checkbox);
        //span with counter
        var span = document.createElement('span');
        //add margin left
        span.style.marginLeft = '5px';
        span.innerHTML = counter;
        td.appendChild(span);
        tr.appendChild(td);
        // loop through the keys of interest and create the corresponding table cells
        for (let [key, value] of Object.entries(recipeDisplayMask)) {
          let td = document.createElement('td');
          if (!value.visible) {
            td.classList.add('d-none');
          }
          td.innerHTML = activitate.object[key] || '';
          td.classList.add('activitate');
          td.id = counter + '@' + key;
          tr.appendChild(td);
        }
        //add children
        var mCounter = 0;
        for (let j = 0; j < activitate.children.length; j++) {
          mCounter++;
          let material = activitate.children[j];
          var tr = document.createElement('tr');
          tr.style.borderBottomColor = 'lightgray';
          tbody.appendChild(tr);
          var td = document.createElement('td');
          td.classList.add('text-secondary');
          td.innerHTML = counter + '.' + mCounter;
          td.classList.add('material');
          tr.appendChild(td);

          // loop through the keys of interest and create the corresponding table cells
          for (let [key, value] of Object.entries(recipeDisplayMask)) {
            let td = document.createElement('td');
            if (!value.visible) {
              td.classList.add('d-none');
            }
            td.innerHTML = material.object[key] || '';
            td.classList.add('material');
            td.id = (mCounter - 1).toString() + '@' + key;
            tr.appendChild(td);
          }
        }
      }

      return html`${table}`;
    }
  }
}
