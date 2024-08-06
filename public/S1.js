import { client } from './client.js';

class S1 {
    static async connectToS1Service() {
        if (!client) {
            throw new Error('Client is not defined');
        }

        const connectToS1 = client.service('connectToS1');
        if (!connectToS1) {
            throw new Error('connectToS1 service is not defined');
        }

        const result = await connectToS1.find();
        return result;
    }

    static async S1_populateSelects() {
        const result = await this.connectToS1Service();
        const clientID = result.token;

        let params = {
            query: {
                clientID: clientID,
                appID: '1001',
                sqlQuery: 'select TRDR, NAME from trdr where sodtype=13 and isactive=1 order by NAME asc'
            }
        };

        const result1 = await client.service('getDataset').find(params);
        //console.log('result', result1);

        if (result1.success) {
            var select_trdr = document.getElementById('trdr');
            result1.data.forEach(function (object) {
                var option = document.createElement('option');
                option.value = object['TRDR'];
                option.text = object['NAME'];
                select_trdr.appendChild(option);
            });
        }
    }

    static async S1_InsertDocument(UIElement, jsonToSend) {
        const result = await this.connectToS1Service();
        const clientID = result.token;
        //console.log('clientID', clientID);
        jsonToSend.clientID = clientID;

        const result1 = await client.service('setDocument').create(jsonToSend);
        console.log('result', result1);

        if (result1.success) {
            UIElement.innerHTML = 'Oferta salvata';
            UIElement.classList.remove('btn-info');
            UIElement.classList.add('btn-success');
            UIElement.disabled = true;
        } else {
            UIElement.innerHTML = 'Eroare salvare oferta';
            UIElement.classList.remove('btn-info');
            UIElement.classList.add('btn-danger');
        }
    }
}
