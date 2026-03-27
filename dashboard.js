import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC5WOYPDNBmX7DP44oGP9QZ177HQkRlvPA",
    authDomain: "sea-level-rise-dashboard.firebaseapp.com",
    projectId: "sea-level-rise-dashboard",
    storageBucket: "sea-level-rise-dashboard.firebasestorage.app",
    messagingSenderId: "925688956050",
    appId: "1:925688956050:web:15c396311f07691058924b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let state = {
    role: null,
    city: 'mumbai',
    year: '2025',
    chart: null
};

const $ = id => document.getElementById(id);
const format = (num, isCurr) => (isCurr ? '$' : '') + (num >= 1e9 ? (num / 1e9).toFixed(1) + 'B' : num >= 1e6 ? (num / 1e6).toFixed(1) + 'M' : num.toLocaleString());

async function fetchData() {
    $('loadingIndicator').classList.remove('hidden');
    const docId = `${state.city}_${state.year}`;
    console.log("Searching for document ID:", docId); 

    try {
        const docRef = doc(db, "SeaLevelData", docId); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Success! Data found:", docSnap.data());
            updateUI(docSnap.data());
        } else {
            console.error(`ERROR: Document "${docId}" does not exist in collection "SeaLevelData"`);
            alert(`Data for ${state.city} in ${state.year} is missing in the database.`);
        }
    } catch (err) {
        console.error("Firebase Error:", err);
    } finally {
        $('loadingIndicator').classList.add('hidden');
    }
}

function updateUI(data) {
    $('riskIndex').textContent = data.riskIndex || 0;
    $('riskLevel').textContent = `${data.riskLevel || 'N/A'} Risk`;
    $('population').textContent = format(data.population || 0);
    $('seaLevelRise').textContent = `${(data.seaLevelRise || 0).toFixed(2)}m`;

    if (state.role === 'government') {
        $('evacuationStatus').textContent = data.evacuationStatus || 'Normal';
        $('fishermenAffected').textContent = format(data.fishermenAffected || 0);
        $('economicLoss').textContent = format(data.economicLoss || 0, true);
        $('populationDisplaced').textContent = format(data.populationDisplaced || 0);
    }
    
    $('lastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    if (window.Chart) updateChart(data); 
}

window.selectRole = (role) => {
    console.log("Button clicked! Role:", role); 
    
    state.role = role;
    
    const overlay = document.getElementById('loginOverlay');
    const dashboard = document.getElementById('dashboard');
    const govtCards = document.getElementById('govtCards');

    if (overlay && dashboard) {
        overlay.style.setProperty('display', 'none', 'important');
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'grid'; 
        
        console.log("UI should have switched now.");
    }

    if (govtCards) {
        govtCards.classList.toggle('hidden', role !== 'government');
    }
    
    document.getElementById('roleDisplay').textContent = 
        role === 'government' ? 'Government Official' : 'Civilian';
    
    fetchData();
};

window.logout = () => {
    state.role = null;
    const dashboard = document.getElementById('dashboard');
    const overlay = document.getElementById('loginOverlay');

    if (dashboard && overlay) {
        dashboard.classList.add('hidden'); 
        dashboard.style.display = 'none';   
        
        overlay.classList.remove('hidden'); 
        overlay.style.display = 'flex';     
    }

    console.log("Logged out. State reset.");
};

document.addEventListener('DOMContentLoaded', () => {
    $('citySelect').onchange = (e) => { state.city = e.target.value; fetchData(); };
    $('yearSelect').onchange = (e) => { state.year = e.target.value; fetchData(); };
});

function updateChart(data) {
    const ctx = $('slrChart').getContext('2d');
    const chartValues = data.chartData || [0, 0, 0, 0]; 
    
    if (state.chart) state.chart.destroy();
    
    state.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['2025', '2030', '2050', '2100'],
            datasets: [{
                label: `Sea Level Rise Projection (mm) - ${state.city.toUpperCase()}`,
                data: chartValues,
                backgroundColor: 'rgba(0, 119, 182, 0.7)',
                borderColor: '#0077b6',
                borderWidth: 1
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: { 
                    beginAtZero: true, 
                    title: { display: true, text: 'Rise in mm' } 
                }
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-section') + 'Section';

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(section => section.classList.add('hidden'));
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        });
    });
});
function updateMap(city) {
    const mapIframe = document.getElementById('googleMap');
    mapIframe.src = `https://maps.google.com/maps?q=${city}%20coastline&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    document.querySelectorAll('.current-city-name').forEach(el => {
        el.textContent = city.charAt(0).toUpperCase() + city.slice(1);
    });
}

window.showReportDetails = function(year) {
    const panel = document.getElementById('reportDetailsPanel');
    panel.innerHTML = `
        <div class="report-card">
            <h3>Summary Report: ${year}</h3>
            <hr>
            <p><strong>Observation:</strong> Sea levels rose by 3.2mm in the ${year} period.</p>
            <p><strong>Critical Areas:</strong> Low-lying regions showed 15% more salt-water intrusion.</p>
            <p><strong>Action Taken:</strong> 2 new sea-walls commissioned.</p>
        </div>
    `;
}

document.getElementById('citySelect').addEventListener('change', (e) => {
    updateMap(e.target.value);
});
document.getElementById('downloadReportBtn').addEventListener('click', () => {
    let reportContent = `SEA LEVEL RISE SUMMARY: ${state.city.toUpperCase()} (${state.year})\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n`;
    reportContent += `-------------------------------------------\n`;
    reportContent += `Risk Index: ${$('riskIndex').textContent}\n`;
    reportContent += `Risk Level: ${$('riskLevel').textContent}\n`;
    reportContent += `Population at Risk: ${$('population').textContent}\n`;
    reportContent += `Sea Level Rise: ${$('seaLevelRise').textContent}\n`;

    if (state.role === 'government') {
        reportContent += `\n*** GOVERNMENT CONFIDENTIAL DATA ***\n`;
        reportContent += `Evacuation Status: ${$('evacuationStatus').textContent}\n`;
        reportContent += `Fishermen Affected: ${$('fishermenAffected').textContent}\n`;
        reportContent += `Population Displaced: ${$('populationDisplaced').textContent}\n`;
        reportContent += `Economic Loss: ${$('economicLoss').textContent}\n`;
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.city}_Impact_Report.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
});
window.toggleTheme = () => {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        themeIcon.textContent = '☀️';
        if (state.chart) {
            state.chart.options.scales.x.ticks.color = '#a0a0a0';
            state.chart.options.scales.y.ticks.color = '#a0a0a0';
            state.chart.update();
        }
    } else {
        themeIcon.textContent = '🌙';
        if (state.chart) {
            state.chart.options.scales.x.ticks.color = '#666';
            state.chart.options.scales.y.ticks.color = '#666';
            state.chart.update();
        }
    }
};