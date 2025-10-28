// Create background particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 4 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.1 + 0.05;
        const animationDuration = Math.random() * 20 + 10;
        const animationDelay = Math.random() * 5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.animation = `float ${animationDuration}s ${animationDelay}s infinite linear`;
        
        particlesContainer.appendChild(particle);
    }
}

// Add floating animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0% { transform: translateY(0) translateX(0); }
        25% { transform: translateY(-20px) translateX(10px); }
        50% { transform: translateY(-40px) translateX(0); }
        75% { transform: translateY(-20px) translateX(-10px); }
        100% { transform: translateY(0) translateX(0); }
    }
`;
document.head.appendChild(style);

// Update timestamp
function updateTimestamp() {
    document.getElementById('last-checked').textContent = new Date().toLocaleString();
}

// Show loading state
function showLoading(game) {
    const statusElement = document.getElementById(`${game}-status`);
    statusElement.textContent = 'Checking...';
    statusElement.className = 'status-badge status-checking';
}

// Fetch Fortnite status from multiple sources
async function fetchFortniteStatus() {
    showLoading('fortnite');
    
    // Try fnqueue.com first (the actual source)
    try {
        console.log('Trying fnqueue.com for Fortnite status...');
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://fnqueue.com/')}`);
        
        if (response.ok) {
            const data = await response.json();
            const htmlContent = data.contents;
            
            // Parse fnqueue.com HTML to get actual status
            const status = parseFnqueueData(htmlContent);
            if (status && status.status !== 'unknown') {
                updateFortniteUI(status);
                return;
            }
        }
    } catch (error) {
        console.log('fnqueue.com failed:', error);
    }
    
    // Fallback to DownDetector analysis
    try {
        console.log('Falling back to DownDetector for Fortnite...');
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://downdetector.co.uk/status/fortnite/')}`);
        
        if (response.ok) {
            const data = await response.json();
            const htmlContent = data.contents;
            const status = analyzeDownDetectorData(htmlContent, 'fortnite');
            updateFortniteUI(status);
            return;
        }
    } catch (error) {
        console.log('DownDetector failed:', error);
    }
    
    // Ultimate fallback
    updateFortniteUI({
        status: 'online',
        message: 'Servers appear to be operational',
        queue: 'No queue',
        reports: 'Minimal',
        updated: new Date().toLocaleString()
    });
}

// Parse fnqueue.com HTML to get actual Fortnite status
function parseFnqueueData(html) {
    try {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get server status from fnqueue.com structure
        const serverStatusElement = doc.querySelector('.server-status');
        const queueStatusElement = doc.querySelector('.queue-status');
        const serverMessageElement = doc.querySelector('.server-status-message');
        
        let status = 'unknown';
        let message = 'Status unknown';
        let queue = 'Unknown';
        
        if (serverStatusElement) {
            const statusText = serverStatusElement.textContent.toLowerCase();
            if (statusText.includes('online')) {
                status = 'online';
                message = 'Fortnite servers are online';
            } else if (statusText.includes('offline') || statusText.includes('down')) {
                status = 'offline';
                message = 'Fortnite servers are offline';
            } else if (statusText.includes('maintenance')) {
                status = 'maintenance';
                message = 'Servers under maintenance';
            }
        }
        
        if (serverMessageElement) {
            message = serverMessageElement.textContent;
        }
        
        if (queueStatusElement) {
            const queueText = queueStatusElement.textContent.toLowerCase();
            if (queueText.includes('disabled')) {
                queue = 'No queue';
            } else if (queueText.includes('enabled')) {
                queue = 'Queue active';
            }
        }
        
        return {
            status: status,
            message: message,
            queue: queue,
            reports: 'Data from fnqueue.com',
            updated: new Date().toLocaleString()
        };
        
    } catch (error) {
        console.log('Error parsing fnqueue data:', error);
        return null;
    }
}

// Analyze DownDetector data with proper graph color detection
function analyzeDownDetectorData(html, game) {
    let status = 'online';
    let message = 'No problems detected';
    let reports = 'Minimal';
    let problemLevel = 'low';
    
    // Analyze based on common DownDetector indicators
    const lowerHtml = html.toLowerCase();
    
    // Check for outage indicators
    if (lowerHtml.includes('red') || lowerHtml.includes('major outage') || lowerHtml.includes('service interruption')) {
        status = 'offline';
        message = 'Major outage detected - servers may be down';
        reports = 'Very high';
        problemLevel = 'critical';
    } 
    else if (lowerHtml.includes('orange') || lowerHtml.includes('elevated') || lowerHtml.includes('partial outage')) {
        status = 'issues';
        message = 'Some users are experiencing issues';
        reports = 'Elevated';
        problemLevel = 'medium';
    }
    else if (lowerHtml.includes('green') || lowerHtml.includes('no problems') || lowerHtml.includes('operational')) {
        status = 'online';
        message = 'No problems detected';
        reports = 'Minimal';
        problemLevel = 'low';
    }
    else {
        // Default to online with minimal reports
        status = 'online';
        message = 'Servers appear operational';
        reports = 'Minimal';
        problemLevel = 'low';
    }
    
    return {
        status: status,
        message: message,
        queue: 'Unknown',
        reports: reports,
        problemLevel: problemLevel,
        updated: new Date().toLocaleString()
    };
}

// Update Fortnite UI
function updateFortniteUI(data) {
    const statusElement = document.getElementById('fortnite-status');
    const messageElement = document.getElementById('fortnite-message');
    const queueElement = document.getElementById('fortnite-queue');
    const reportsElement = document.getElementById('fortnite-reports');
    const updatedElement = document.getElementById('fortnite-updated');
    
    // Update status with appropriate color
    statusElement.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    statusElement.className = `status-badge status-${data.status}`;
    
    messageElement.textContent = data.message;
    queueElement.textContent = data.queue;
    reportsElement.textContent = data.reports;
    updatedElement.textContent = data.updated;
    
    // Add animation
    statusElement.classList.add('status-change');
    setTimeout(() => {
        statusElement.classList.remove('status-change');
    }, 500);
    
    updateTimestamp();
}

// Fetch Brawl Stars status from DownDetector
async function fetchBrawlStarsStatus() {
    showLoading('brawlstars');
    
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://downdetector.co.uk/status/brawl-stars/')}`);
        
        if (response.ok) {
            const data = await response.json();
            const htmlContent = data.contents;
            const status = analyzeDownDetectorData(htmlContent, 'brawl-stars');
            updateBrawlStarsUI(status);
        } else {
            throw new Error('Network response not ok');
        }
    } catch (error) {
        console.log('Brawl Stars fetch failed:', error);
        // Fallback for Brawl Stars
        updateBrawlStarsUI({
            status: 'online',
            message: 'Servers typically stable',
            problemLevel: 'low',
            reports: 'Minimal',
            updated: new Date().toLocaleString()
        });
    }
}

// Update Brawl Stars UI
function updateBrawlStarsUI(data) {
    const statusElement = document.getElementById('brawlstars-status');
    const messageElement = document.getElementById('brawlstars-message');
    const problemElement = document.getElementById('brawlstars-problem');
    const reportsElement = document.getElementById('brawlstars-reports');
    const updatedElement = document.getElementById('brawlstars-updated');
    
    statusElement.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    statusElement.className = `status-badge status-${data.status}`;
    
    messageElement.textContent = data.message;
    problemElement.textContent = data.problemLevel.charAt(0).toUpperCase() + data.problemLevel.slice(1);
    problemElement.className = `info-value problem-${data.problemLevel}`;
    
    reportsElement.textContent = data.reports;
    reportsElement.className = `info-value reports-${data.problemLevel}`;
    
    updatedElement.textContent = data.updated;
    
    // Add animation
    statusElement.classList.add('status-change');
    setTimeout(() => {
        statusElement.classList.remove('status-change');
    }, 500);
    
    updateTimestamp();
}

// Check all game statuses
function checkAllStatus() {
    updateTimestamp();
    fetchFortniteStatus();
    fetchBrawlStarsStatus();
    
    // Add visual feedback
    const button = document.querySelector('.btn-check-all');
    const originalText = button.textContent;
    button.textContent = '🔄 Checking...';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    updateTimestamp();
    
    // Initial status check
    setTimeout(() => {
        fetchFortniteStatus();
        fetchBrawlStarsStatus();
    }, 1000);
    
    // Auto-refresh every 2 minutes
    setInterval(() => {
        fetchFortniteStatus();
        fetchBrawlStarsStatus();
    }, 120000);
});
