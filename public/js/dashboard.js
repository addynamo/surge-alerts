let activityChart;

// Initialize the chart
function initChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Activity Values',
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'Threshold',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                borderDash: [5, 5],
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Update the dashboard with new metrics
function updateMetrics() {
    fetch('/api/metrics')
        .then(response => response.json())
        .then(data => {
            document.getElementById('currentAverage').textContent = 
                data.current_average?.toFixed(2) || '-';
            document.getElementById('currentThreshold').textContent = 
                data.threshold?.toFixed(2) || '-';
            document.getElementById('recentSpikes').textContent = 
                data.recent_spikes?.length || '0';

            // Update chart
            const recentValues = data.recent_values || [];
            activityChart.data.labels = recentValues.map(v => {
                const date = new Date(v.timestamp);
                return date.toLocaleTimeString();
            });
            activityChart.data.datasets[0].data = recentValues.map(v => v.value);
            
            // Add threshold line
            if (data.threshold) {
                activityChart.data.datasets[1].data = new Array(recentValues.length).fill(data.threshold);
            }
            
            activityChart.update();
        })
        .catch(error => console.error('Error fetching metrics:', error));
}

// Send test activity
function sendActivity() {
    const value = parseFloat(document.getElementById('activityValue').value);
    fetch('/api/activity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: value })
    })
    .then(response => response.json())
    .then(data => {
        if (data.is_spike) {
            alert('Spike detected!');
        }
        updateMetrics();
    })
    .catch(error => console.error('Error sending activity:', error));
}

// Update configuration
function updateConfig() {
    const threshold = parseFloat(document.getElementById('thresholdInput').value);
    fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ threshold_std: threshold })
    })
    .then(response => response.json())
    .then(() => updateMetrics())
    .catch(error => console.error('Error updating config:', error));
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    updateMetrics();
    // Update metrics every 5 seconds
    setInterval(updateMetrics, 5000);
});
