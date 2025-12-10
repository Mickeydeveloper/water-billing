<!DOCTYPE html>
<html lang="sw">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekodi za Data Zilizoboreshwa</title>
    <style>
        /* CSS kwa ajili ya muonekano */
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f4f4f4;
            color: #333;
        }

        h1 {
            color: #2c3e50;
            text-align: center;
        }

        .controls {
            text-align: center;
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
        }

        button {
            padding: 10px 15px;
            background-color: #2ecc71;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        
        button.add-btn {
            background-color: #3498db;
        }

        button.reset-btn {
            background-color: #e74c3c;
        }

        button:hover {
            background-color: #27ae60;
        }
        button.add-btn:hover {
            background-color: #2980b9;
        }
        button.reset-btn:hover {
            background-color: #c0392b;
        }

        /* Muundo wa Meza */
        #data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background-color: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            overflow-x: auto; /* Inasaidia kufanya meza iweze kusogeza ikiwa pana sana */
        }

        #data-table th, #data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            min-width: 60px;
        }

        #data-table th {
            background-color: #34495e;
            color: white;
            font-weight: bold;
        }

        .editable {
            background-color: #ecf0f1;
        }

        #status-message {
            text-align: center;
            margin-top: 10px;
            font-weight: bold;
            height: 20px;
        }
    </style>
</head>
<body>

    <h1>📊 Rekodi za Data Zilizoboreshwa</h1>

    <div class="controls">
        <button onclick="saveData()">Hifadhi Mabadiliko (Save)</button>
        <button class="add-btn" onclick="addRecord()">➕ Ongeza Mtu/Rekodi</button>
        <button class="add-btn" onclick="addColumn()">➕ Ongeza Mwezi/Safu Wima</button>
        <button class="reset-btn" onclick="resetData()">♻️ Anzisha Upya (Reset)</button>
    </div>

    <div id="status-message"></div>

    <div style="overflow-x:auto;">
        <table id="data-table">
            <thead>
                <tr id="table-header-row">
                    <th>JINA</th>
                    </tr>
            </thead>
            <tbody id="table-body">
                </tbody>
        </table>
    </div>

    <script>
        // Data ya awali kutoka kwenye picha (Imebadilishwa kidogo ili kulingana na muundo wa JSON)
        const initialData = [
            // Kichwa cha Safu (JINA) kinapaswa kuwa hapa
            { JINA: "LEFECIO", '8': "643", '9': "649", '10': "658", '11': "670" },
            { JINA: "MAMA DAVID", '8': "542", '9': "552", '10': "560", '11': "571" },
            { JINA: "MAMA DICK", '8': "94", '9': "106", '10': "120", '11': "138" },
            { JINA: "BATI LA BUS", '8': "55", '9': "59", '10': "64", '11': "70" },
            { JINA: "Esopsa/Mati Manukato Mzuri", '8': "218", '9': "225", '10': "226", '11': "237" },
            { JINA: "LIS MUTA WA 200ml", '8': "418", '9': "447", '10': "449", '11': "456" },
            { JINA: "MAMA GREEN", '8': "37", '9': "42", '10': "48", '11': "56" },
            { JINA: "NUNA HOPE", '8': "6", '9': "10", '10': "", '11': "" },
        ];
        
        const initialHeaders = ['8', '9', '10', '11'];
        const localStorageKey = 'recordDataEnhanced';
        const localStorageHeadersKey = 'recordHeadersEnhanced';
        const tableBody = document.getElementById('table-body');
        const tableHeaderRow = document.getElementById('table-header-row');
        const statusMessage = document.getElementById('status-message');

        // *************** KAZI ZA MSINGI (LOADING, SAVING, RENDERING) ***************

        // 1. Kazi ya Kupakia Data na Vichwa
        function loadData() {
            const savedData = localStorage.getItem(localStorageKey);
            const savedHeaders = localStorage.getItem(localStorageHeadersKey);

            let data = initialData;
            let headers = initialHeaders;

            if (savedData && savedHeaders) {
                try {
                    data = JSON.parse(savedData);
                    headers = JSON.parse(savedHeaders);
                    showMessage("Data iliyohifadhiwa imepakiwa.", "green");
                } catch (e) {
                    showMessage("Hitilafu katika kupakia data iliyohifadhiwa. Data ya awali inatumika.", "red");
                }
            } else {
                // Hakuna hifadhi, tengeneza hifadhi mpya
                localStorage.setItem(localStorageHeadersKey, JSON.stringify(initialHeaders));
                localStorage.setItem(localStorageKey, JSON.stringify(initialData));
                showMessage("Imeanzishwa kwa data ya awali. Hifadhi kabla ya kuondoka.", "blue");
            }
            
            renderTable(data, headers);
        }

        // 2. Kazi ya Kuunda Meza (Rendering)
        function renderTable(data, headers) {
            // A. Tengeneza Vichwa vya Meza
            tableHeaderRow.innerHTML = '<th>JINA</th>'; // Anza na 'JINA'
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                th.setAttribute('contenteditable', 'true'); // Weka ruhusa ya kuhariri namba ya mwezi
                tableHeaderRow.appendChild(th);
            });

            // B. Tengeneza Safu Mlalo za Data
            tableBody.innerHTML = '';
            data.forEach(item => {
                const row = tableBody.insertRow();
                
                // Seli ya JINA
                let nameCell = row.insertCell();
                nameCell.textContent = item.JINA || '';
                nameCell.setAttribute('contenteditable', 'true');

                // Seli za Alama (Miezi)
                headers.forEach(header => {
                    let scoreCell = row.insertCell();
                    // Tumia thamani kutoka kwenye data kwa kutumia kichwa cha safu kama ufunguo
                    scoreCell.textContent = item[header] !== undefined ? item[header] : '';
                    scoreCell.setAttribute('contenteditable', 'true');
                    scoreCell.classList.add('editable');
                });
            });
            // Pia ongeza kazi ya kusikiliza mabadiliko kwenye vichwa vya meza
            document.querySelectorAll('#table-header-row th[contenteditable="true"]').forEach(th => {
                th.addEventListener('blur', updateHeadersInLocalStorage);
            });
        }

        // 3. Kazi ya Kuhifadhi Data
        function saveData() {
            const { data, headers } = getTableData(); // Pata data na vichwa
            
            try {
                localStorage.setItem(localStorageKey, JSON.stringify(data));
                localStorage.setItem(localStorageHeadersKey, JSON.stringify(headers));
                showMessage("✅ Mabadiliko yamehifadhiwa kwa ufanisi!", "green");
            } catch (e) {
                showMessage("❌ Kushindwa kuhifadhi. Huenda hifadhi imejaa.", "red");
            }
        }

        // 4. Kazi ya Kupata Data (Pamoja na Vichwa) Kutoka Kwenye Meza
        function getTableData() {
            const data = [];
            const rows = tableBody.querySelectorAll('tr');
            
            // Pata vichwa vya safu (miezi)
            const headerCells = tableHeaderRow.querySelectorAll('th');
            const headers = Array.from(headerCells).map(th => th.textContent.trim()).filter(h => h && h !== 'JINA');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = {};
                
                if (cells.length > 0) {
                    rowData['JINA'] = cells[0].textContent.trim();
                    
                    // Jaza data ya safu kulingana na vichwa
                    headers.forEach((header, index) => {
                        // Index 0 ni JINA, kwa hiyo data inaanza index 1
                        if (cells[index + 1]) { 
                            rowData[header] = cells[index + 1].textContent.trim();
                        }
                    });
                    data.push(rowData);
                }
            });
            return { data, headers };
        }
        
        // Kazi ya kusasisha vichwa kwenye local storage baada ya mabadiliko
        function updateHeadersInLocalStorage() {
            const { data, headers } = getTableData();
            // Upakuzi wa meza upya na uhifadhi huhakikisha uthabiti
            localStorage.setItem(localStorageHeadersKey, JSON.stringify(headers));
            // Msimbo unaweza kufanya saveData() lakini tunaepuka hilo ili kuepuka kuhesabu data mara mbili.
        }

        // 5. Kazi ya Kuanzisha Upya (Reset)
        function resetData() {
            if (confirm("Uko karibu kufuta data yote iliyohifadhiwa na kurudi kwenye data ya awali. Una uhakika?")) {
                localStorage.removeItem(localStorageKey);
                localStorage.removeItem(localStorageHeadersKey);
                loadData();
                showMessage("Data imefutwa na kurudishwa kwenye hali ya awali.", "orange");
            }
        }
        
        // 6. Kazi ya Kuonyesha Ujumbe
        function showMessage(msg, color) {
            statusMessage.textContent = msg;
            statusMessage.style.color = color;
            setTimeout(() => {
                statusMessage.textContent = '';
            }, 4000);
        }

        // *************** KAZI MPYA ZILIZOOMBWA ***************
        
        // 7. Ongeza Mtu/Rekodi Mpya (Safu Mlalo)
        function addRecord() {
            // Pata vichwa vya sasa vilivyohifadhiwa
            const currentHeaders = getTableData().headers; 
            
            const row = tableBody.insertRow();
            
            // Seli ya JINA
            let nameCell = row.insertCell();
            nameCell.textContent = "Jina Jipya";
            nameCell.setAttribute('contenteditable', 'true');
            
            // Seli za Alama (kwa kila mwezi uliopo)
            currentHeaders.forEach(() => {
                let scoreCell = row.insertCell();
                scoreCell.textContent = "";
                scoreCell.setAttribute('contenteditable', 'true');
                scoreCell.classList.add('editable');
            });
            
            // Hifadhi data mpya baada ya kuongeza
            saveData(); 
            showMessage("Rekodi mpya imeongezwa. Hifadhi (Save) ili kudumisha.", "blue");
        }

        // 8. Ongeza Mwezi/Safu Wima Mpya
        function addColumn() {
            const { data, headers } = getTableData();
            
            // Tafuta namba mpya ya mwezi
            let newHeaderNumber = 1;
            if (headers.length > 0) {
                // Jaribu kupata namba kubwa zaidi na kuongeza 1, ikiwa vichwa ni namba
                const numericHeaders = headers.map(h => parseInt(h)).filter(n => !isNaN(n));
                if (numericHeaders.length > 0) {
                     newHeaderNumber = Math.max(...numericHeaders) + 1;
                }
            }
            const newHeader = String(newHeaderNumber);
            
            // A. Sasisha Vichwa
            headers.push(newHeader);
            
            // B. Sasisha Data (Ongeza ufunguo tupu kwa kila rekodi)
            data.forEach(item => {
                item[newHeader] = '';
            });
            
            // C. Pakia Meza upya ili kuonyesha safu wima mpya
            renderTable(data, headers);
            
            // D. Hifadhi Mabadiliko
            saveData();
            showMessage(`Mwezi/Safu Wima '${newHeader}' imeongezwa. Hifadhi (Save) ili kudumisha.`, "blue");
        }


        // Pakia data meza inapoanza
        window.onload = loadData;

    </script>

</body>
</html>
