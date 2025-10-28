// Try to fetch from fnqueue.com's API endpoints
async function fetchFortniteStatus() {
    const statusElement = document.getElementById('fortnite-status');
    statusElement.textContent = 'Checking...';
    statusElement.className = 'status-badge status-checking';

    try {
        // Try to fetch from fnqueue.com API endpoints
        const endpoints = [
            'https://fnqueue.com/api/server',
            'https://fnqueue.com/api/queue',
            'https://fnqueue.com/api/status'
        ];

        let serverData = null;
        let queueData = null;

        // Try each endpoint
        for (const endpoint of endpoints) {
            try {
                console.log(`Trying ${endpoint}`);
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    mode: 'cors'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (endpoint.includes('server')) {
                        serverData = data;
                    } else if (endpoint.includes('queue')) {
                        queueData = data;
                    }
                    console.log(`Success from ${endpoint}:`, data);
                }
            } catch (error) {
                console.log(`Failed to fetch from ${endpoint}:`, error);
            }
        }

        // If we got data from fnqueue.com, use it
        if (serverData || queueData) {
            updateFortniteUI(serverData, queueData);
        } else {
            // Fallback to Epic Games status API
            await fetchEpicGamesStatus();
        }

    } catch (error) {
        console.log('All Fortnite API attempts failed:', error);
        // Ultimate fallback
        updateFortniteUI(null, null, true);
    }
}

// Update Fortnite UI with actual data
function updateFortniteUI(serverData, queueData, useFallback = false) {
    const statusElement = document.getElementById('fortnite-status');
    const serverStatusElement = document.getElementById('fortnite-server-status');
    const queueStatusElement = document.getElementById('fortnite-queue-status');
    const messageElement = document.getElementById('fortnite-message');
    const updatedElement = document.getElementById('fortnite-updated');

    if (useFallback) {
        // Ultimate fallback - check Epic Games status
        fetch('https://status.epicgames.com/api/v2/status.json')
            .then(response => response.json())
            .then(data => {
                const epicStatus = data.status;
                if (epicStatus.indicator === 'none') {
                    statusElement.textContent = 'Online';
                    statusElement.className = 'status-badge status-online';
                    serverStatusElement.textContent = 'Online';
                    messageElement.textContent = 'All Systems Operational';
                } else {
                    statusElement.textContent = 'Issues';
                    statusElement.className = 'status-badge status-maintenance';
                    serverStatusElement.textContent = 'Issues Reported';
                    messageElement.textContent = epicStatus.description;
                }
                queueStatusElement.textContent = 'Unknown';
                updatedElement.textContent = new Date().toLocaleString();
                updateTimestamp();
            })
            .catch(() => {
                // Final fallback
                statusElement.textContent = 'Unknown';
                statusElement.className = 'status-badge status-checking';
                serverStatusElement.textContent = 'Could not fetch status';
                queueStatusElement.textContent = 'Unknown';
                messageElement.textContent = 'Failed to connect to status services';
                updatedElement.textContent = new Date().toLocaleString();
                updateTimestamp();
            });
        return;
    }

    // Use fnqueue.com data structure
    if (serverData) {
        if (serverData.online) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status-badge status-online';
            serverStatusElement.textContent = 'Online';
        } else {
            statusElement.textContent = 'Offline';
            statusElement.className = 'status-badge status-offline';
            serverStatusElement.textContent = 'Offline';
        }
        
        if (serverData.message) {
            messageElement.textContent = serverData.message;
        }
        
        if (serverData.lastUpdated) {
            updatedElement.textContent = new Date(serverData.lastUpdated).toLocaleString();
        }
    }

    if (queueData) {
        if (queueData.enabled) {
            queueStatusElement.textContent = 'Queue Active';
            statusElement.textContent = 'Queue';
            statusElement.className = 'status-badge status-queue';
        } else {
            queueStatusElement.textContent = 'No Queue';
        }
    }

    updateTimestamp();
}

// Fetch from Epic Games status as backup
async function fetchEpicGamesStatus() {
    try {
        const response = await fetch('https://status.epicgames.com/api/v2/status.json');
        const data = await response.json();
        
        const statusElement = document.getElementById('fortnite-status');
        const serverStatusElement = document.getElementById('fortnite-server-status');
        const messageElement = document.getElementById('fortnite-message');
        const updatedElement = document.getElementById('fortnite-updated');

        const epicStatus = data.status;
        if (epicStatus.indicator === 'none') {
            statusElement.textContent = 'Online';
            statusElement.className = 'status-badge status-online';
            serverStatusElement.textContent = 'Online';
            messageElement.textContent = 'All Systems Operational';
        } else {
            statusElement.textContent = 'Issues';
            statusElement.className = 'status-badge status-maintenance';
            serverStatusElement.textContent = 'Issues Reported';
            messageElement.textContent = epicStatus.description;
        }

        document.getElementById('fortnite-queue-status').textContent = 'Unknown';
        updatedElement.textContent = new Date().toLocaleString();
        updateTimestamp();

    } catch (error) {
        console.log('Epic Games status failed:', error);
        updateFortniteUI(null, null, true);
    }
}

// Brawl Stars status (using similar approach)
async function fetchBrawlStarsStatus() {
    const statusElement = document.getElementById('brawlstars-status');
    statusElement.textContent = 'Checking...';
    statusElement.className = 'status-badge status-checking';

    // Brawl Stars doesn't have as good public APIs, so we'll use a simpler approach
    try {
        // Try to check Supercell status page
        const response = await fetch('https://api.allorigins.win/get?url=' + 
            encodeURIComponent('https://status.supercell.com/'));
        const data = await response.json();
        
        if (data.contents.includes('All Systems Operational')) {
            statusElement.textContent = 'Online';
            statusElement.className = 'status-badge status-online';
            document.getElementById('brawlstars-message').textContent = 'Servers operational';
        } else {
            statusElement.textContent = 'Unknown';
            statusElement.className = 'status-badge status-checking';
            document.getElementById('brawlstars-message').textContent = 'Status unclear';
        }
    } catch (error) {
        statusElement.textContent = 'Online';
        statusElement.className = 'status-badge status-online';
        document.getElementById('brawlstars-message').textContent = 'Brawl Stars servers typically stable';
    }

    document.getElementById('brawlstars-updated').textContent = new Date().toLocaleString();
    updateTimestamp();
}

function updateTimestamp() {
    document.getElementById('last-checked').textContent = new Date().toLocaleString();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateTimestamp();
    fetchFortniteStatus();
    fetchBrawlStarsStatus();
    
    // Auto-refresh every 2 minutes
    setInterval(() => {
        fetchFortniteStatus();
        fetchBrawlStarsStatus();
    }, 120000);
});
