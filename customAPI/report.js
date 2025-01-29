function createMemoryTable(measurement) {
    // Create table element
    const data = JSON.parse(measurement);
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '50%';
  
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Process', 'Path', 'Amount', 'Units', 'Description'];
    
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.border = '1px solid black';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f2f2f2';
     
        
        // Set width for path column
        if (text === 'Path') {
            th.style.maxWidth = '300px'; // Limit path width
            th.style.width = '30%';      // Or use percentage
        }

        // Set width for description column
        if (text === 'Description') {
            th.style.maxWidth = '300px'; // Limit path width
            th.style.width = '30%';      // Or use percentage
        }

        headerRow.appendChild(th);
        
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    // Create table body
    const tbody = document.createElement('tbody');
    data.measurements.forEach(item => {
        const row = document.createElement('tr');
        
        // Create cells
        const cells = [
            item.process,
            item.path,
            formatBytes(item.amount),
            getUnitName(item.units),
            item.description
        ];
  
        cells.forEach((text, index) => {
            const td = document.createElement('td');
            td.textContent = text;
            td.style.border = '1px solid black';
            td.style.padding = '8px';

            if (index === 1) { // Path column
                td.style.maxWidth = '300px';
                td.style.overflow = 'hidden';
                td.style.textOverflow = 'ellipsis';
                td.style.whiteSpace = 'nowrap';
                // Add tooltip to show full path on hover
                td.title = text;
            }

            if (index === 4) { // Path column
                td.style.maxWidth = '300px';
                td.style.overflow = 'hidden';
                td.style.textOverflow = 'ellipsis';
                td.style.whiteSpace = 'nowrap';
                // Add tooltip to show full path on hover
                td.title = text;
            }
            row.appendChild(td);
        });
  
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
  
    return table;
  }
  
  // Helper function to format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Helper function to convert unit numbers to names
  function getUnitName(unit) {
    const units = {
        0: 'BYTES',
        1: 'COUNT',
        2: 'COUNT_CUMULATIVE',
        3: 'PERCENTAGE'
    };
    return units[unit] || 'Unknown';
  }
 
document.addEventListener('DOMContentLoaded', function () {
    try {
        // Get data from storage
        console.log("Popup loaded");
        const memoryData = localStorage.getItem("popupData");
        console.log("Memory Data: ", memoryData);
        const table = createMemoryTable(memoryData);
        document.body.appendChild(table);

    } catch (error) {
        console.error("Error loading data:", error);
    }
});