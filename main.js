const form = document.getElementById('workForm');
const entriesDiv = document.getElementById('entries');
const deleteAllButton = document.getElementById('deleteAll');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    addEntry();
});

deleteAllButton.addEventListener('click', function() {
    deleteAllEntries();
});

// Load existing entries and calculate total worked hours and earnings on page load
window.addEventListener('load', function() {
    loadEntries();
    displayTotalWorkedHoursAndEarnings();
});

function addEntry() {
    const startDate = new Date(document.getElementById('date').value);
    const startTimeInput = document.getElementById('startTime').value;
    const endTimeInput = document.getElementById('endTime').value;
    const breakTime = parseInt(document.getElementById('breakTime').value);
    let wagePerHour = parseFloat(document.getElementById('wagePerHour').value);

    // Check if the Public Holiday checkbox is checked
    const publicHolidayCheckbox = document.getElementById('publicHoliday');
    if (publicHolidayCheckbox.checked) {
        // If checked, double the hourly wage
        wagePerHour *= 2;
    }

    // Parsing start time
    let startTimeSplit = startTimeInput.split(":");
    let startHours = parseInt(startTimeSplit[0]);
    let startMinutes = parseInt(startTimeSplit[1].substr(0, 2)); // Remove AM/PM designation
    if (startTimeInput.includes("PM")) {
        startHours += 12; // Convert to 24-hour format
    }

    // Parsing end time
    let endTimeSplit = endTimeInput.split(":");
    let endHours = parseInt(endTimeSplit[0]);
    let endMinutes = parseInt(endTimeSplit[1].substr(0, 2)); // Remove AM/PM designation
    if (endTimeInput.includes("PM")) {
        endHours += 12; // Convert to 24-hour format
    }

    const startTime = new Date(startDate);
    startTime.setHours(startHours, startMinutes, 0, 0);

    const endTime = new Date(startDate);
    endTime.setHours(endHours, endMinutes, 0, 0);

    if (endTime < startTime) {
        endTime.setDate(startDate.getDate() + 1);
    }

    const totalMilliseconds = endTime - startTime;
    const totalHours = totalMilliseconds / (1000 * 60 * 60);
    const totalHoursWithoutBreak = totalHours - (breakTime / 60);

    if (totalHoursWithoutBreak < 0) {
        alert("End time should be after start time!");
        return;
    }

    let totalEarnings = 0;

    // Calculate earnings from start time to 20:00
    let endTimeBeforeNightShift = new Date(startTime);
    endTimeBeforeNightShift.setHours(20, 0, 0, 0);
    if (endTimeBeforeNightShift > endTime) {
        endTimeBeforeNightShift = new Date(endTime);
    }
    const hoursBeforeNightShift = (endTimeBeforeNightShift - startTime) / (1000 * 60 * 60);
    totalEarnings += hoursBeforeNightShift * wagePerHour;

    // Calculate earnings from 20:00 to end time
    if (endTime > endTimeBeforeNightShift) {
        const hoursAfterNightShift = (endTime - endTimeBeforeNightShift) / (1000 * 60 * 60);
        totalEarnings += hoursAfterNightShift * (wagePerHour * 1.15); // Apply 15% increase for night shift
    }

    const hours = Math.floor(totalHoursWithoutBreak);
    const minutes = Math.round((totalHoursWithoutBreak - hours) * 60);

    const formattedTotalHours = `${hours} hours and ${minutes} minutes`;

    const entry = {
        date: startDate.toLocaleDateString(),
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        breakTime: breakTime,
        totalHours: formattedTotalHours,
        totalEarnings: totalEarnings.toFixed(2)
    };

    let entries = getEntriesFromLocalStorage();
    entries.push(entry);
    localStorage.setItem('workEntries', JSON.stringify(entries));

    loadEntries();
    displayTotalWorkedHoursAndEarnings();
}


function loadEntries() {
    entriesDiv.innerHTML = '';
    let entries = getEntriesFromLocalStorage();

    // Sort entries by date in descending order
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    entries.forEach(function(entry, index) {
        const entryRow = document.createElement('tr');
        // Extract day, month, and year from the date object
        const day = ('0' + new Date(entry.date).getDate()).slice(-2);
        const month = ('0' + (new Date(entry.date).getMonth() + 1)).slice(-2);
        const year = new Date(entry.date).getFullYear();

        entryRow.innerHTML = `
            <td>${day}/${month}/${year}</td>
            <td>${new Date(entry.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
            <td>${new Date(entry.endTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
            <td>${entry.breakTime} minutes</td>
            <td>${entry.totalHours}</td>
            <td>${entry.totalEarnings} euros</td>
        `;
        entriesDiv.appendChild(entryRow);
    });
}

function deleteAllEntries() {
    localStorage.removeItem('workEntries');
    entriesDiv.innerHTML = '';
    displayTotalWorkedHoursAndEarnings();
}

function getEntriesFromLocalStorage() {
    return JSON.parse(localStorage.getItem('workEntries')) || [];
}

function displayTotalWorkedHoursAndEarnings() {
    const currentMonth = new Date().getMonth() + 1;
    const entries = getEntriesFromLocalStorage();
    const wagePerHour = parseFloat(document.getElementById('wagePerHour').value);

    let totalHours = 0;
    let totalEarnings = 0;

    entries.forEach(entry => {
        const hours = parseInt(entry.totalHours.split(' ')[0]);
        const minutes = parseInt(entry.totalHours.split(' ')[3]);
        const workedHours = hours + (minutes / 60);
        totalHours += workedHours;
        totalEarnings += parseFloat(entry.totalEarnings);
    });

    const totalHoursDiv = document.getElementById('totalHours');
    totalHoursDiv.textContent = `Total Worked Hours This Month: ${totalHours.toFixed(2)} hours and made  ${totalEarnings.toFixed(2)} euros`;
}
