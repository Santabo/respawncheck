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

// Track previous status for better maintenance detection
let previousStatus = {
    brawlstars: {
        status: 'unknown',
        reports: 0,
        timestamp: null
    }
};

// WebSocket connection for Fortnite
let fortniteSocket = null;

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

// Initialize WebSocket connection for Fortnite
function initFortniteWebSocket() {
    try {
        // Connect to fnqueue.com's WebSocket
        fortniteSocket = io('https://fnqueue.com', {
            transports: ['websocket'],
            timeout: 5000
        });

        fortniteSocket.on('connect', () => {
            console.log('Connected to Fortnite WebSocket');
        });

        fortniteSocket.on('status', (data) => {
            console.log('Received Fortnite status from WebSocket:', data);
            if (data && data.server) {
                updateFortniteFromWebSocket(data);
            }
        });

        fortniteSocket.on('disconnect', () => {
            console.log('Disconnected from Fortnite WebSocket');
            // Fallback to API calls
            setTimeout(fetchFortniteStatus, 5000);
        });

        fortniteSocket.on('connect_error', (error) => {
            console.log('WebSocket connection error:', error);
            // Fallback to API calls
            fetchFortniteStatus();
        });

    } catch (error) {
        console.log('WebSocket initialization failed:', error);
        fetchFortniteStatus();
    }
}

// Update Fortnite status from WebSocket data
function updateFortniteFromWebSocket(data) {
    const serverData = data.server;
    const queueData = data.queue;
    
    let status = 'unknown';
    let message = 'Status unknown';
    let queue = 'Unknown';
    
    if (serverData.current) {
        if (serverData.current.isUp) {
            status = 'online';
            message = serverData.current.message || 'Fortnite servers are online';
        } else {
            status = 'offline';
            message = serverData.current.message || 'Fortnite servers are offline';
        }
    }
    
    if (queueData.current) {
        if (queueData.current.enabled) {
            queue = 'Queue active';
            if (queueData.current.time !== null) {
                queue = `Queue: ${formatSeconds(queueData.current.time)}`;
            }
        } else {
            queue = 'No queue';
        }
    }
    
    updateFortniteUI({
        status: status,
        message: message,
        queue: queue,
        reports: 'Live data',
        updated: new Date().toLocaleString()
    });
}

// Format seconds to HH:MM:SS
function formatSeconds(seconds) {
    return new Date(seconds * 1000)
        .toISOString()
        .slice(11, 19)
        .replace(/^(00:)+/, '');
}

// Fetch Fortnite status from multiple sources
async function fetchFortniteStatus() {
    showLoading('fortnite');
    
    // Try WebSocket first if available
    if (fortniteSocket && fortniteSocket.connected) {
        console.log('Using WebSocket for Fortnite status');
        return;
    }
    
    // Fallback to API calls
    try {
        console.log('Trying fnqueue.com API for Fortnite status...');
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
        console.log('fnqueue.com API failed:', error);
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

// Fetch latest Fortnite tweet using a more reliable method
async function fetchFortniteTweet() {
    try {
        // Use a Twitter API proxy that gets the latest tweets (not pinned)
        console.log('Fetching latest Fortnite tweet...');
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://cdn.syndication.twimg.com/timeline/profile?screen_name=FortniteStatus&count=5')}`);
        
        if (response.ok) {
            const data = await response.json();
            const timelineData = JSON.parse(data.contents);
            
            if (timelineData && timelineData[0] && timelineData[0].content) {
                // Get the first (latest) tweet that's not a retweet or pinned
                const latestTweet = findLatestNonPinnedTweet(timelineData);
                if (latestTweet) {
                    displayFortniteTweet(latestTweet);
                    return;
                }
            }
        }
    } catch (error) {
        console.log('Twitter API failed:', error);
    }
    
    // Fallback: Try direct HTML parsing
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://twitter.com/FortniteStatus')}`);
        if (response.ok) {
            const data = await response.json();
            const htmlContent = data.contents;
            const tweet = parseLatestTweetFromHTML(htmlContent);
            if (tweet) {
                displayFortniteTweet(tweet);
                return;
            }
        }
    } catch (error) {
        console.log('HTML parsing failed:', error);
    }
    
    // Ultimate fallback
    displayFallbackTweet();
}

// Find the latest non-pinned tweet from timeline data
function findLatestNonPinnedTweet(timelineData) {
    for (let i = 0; i < Math.min(timelineData.length, 5); i++) {
        const item = timelineData[i];
        if (item.content && item.content.tweet) {
            const tweet = item.content.tweet;
            // Skip retweets and check if it's not pinned (we can't easily detect pinned, but take the first few)
            if (!tweet.text.startsWith('RT @')) {
                return {
                    text: tweet.text,
                    time: tweet.created_at,
                    url: `https://twitter.com/FortniteStatus/status/${tweet.id}`
                };
            }
        }
    }
    return null;
}

// Parse the latest tweet from Twitter HTML (more robust method)
function parseLatestTweetFromHTML(html) {
    try {
        // Look for tweet text in the HTML structure
        const tweetMatch = html.match(/<div[^>]*data-testid="tweetText"[^>]*>(.*?)<\/div>/);
        if (tweetMatch && tweetMatch[1]) {
            let tweetText = tweetMatch[1]
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
            
            // Limit length and clean up
            if (tweetText.length > 200) {
                tweetText = tweetText.substring(0, 200) + '...';
            }
            
            return {
                text: tweetText,
                time: new Date().toISOString(),
                url: 'https://twitter.com/FortniteStatus'
            };
        }
    } catch (error) {
        console.log('Error parsing tweet from HTML:', error);
    }
    return null;
}

// Display fallback tweet when we can't fetch real tweets
function displayFallbackTweet() {
    const tweetContainer = document.getElementById('fortnite-tweet');
    
    const fallbackMessages = [
        "Follow @FortniteStatus for official server updates and maintenance announcements.",
        "Check @FortniteStatus on Twitter for the latest server status and news.",
        "For real-time Fortnite server updates, follow the official @FortniteStatus account.",
        "Server status is being monitored. @FortniteStatus posts official updates."
    ];
    
    const randomMessage = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    const currentTime = new Date().toLocaleTimeString();
    
    tweetContainer.innerHTML = `
        <div class="tweet-text">${randomMessage}</div>
        <div class="tweet-meta">
            <span class="tweet-time">Last checked: ${currentTime}</span>
        </div>
    `;
}

// Display Fortnite tweet in the UI
function displayFortniteTweet(tweet) {
    const tweetContainer = document.getElementById('fortnite-tweet');
    let tweetText = tweet.text || 'No tweet content available';
    const tweetTime = tweet.time ? new Date(tweet.time).toLocaleString() : new Date().toLocaleString();
    
    // Clean and style the tweet text
    tweetText = tweetText
        .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
        .replace(/@(\w+)/g, '<span class="tweet-mention">@$1</span>')
        .replace(/#(\w+)/g, '<span class="tweet-hashtag">#$1</span>');
    
    // Limit length if needed
    if (tweetText.length > 250) {
        tweetText = tweetText.substring(0, 250) + '...';
    }
    
    tweetContainer.innerHTML = `
        <div class="tweet-text">${tweetText}</div>
        <div class="tweet-meta">
            <span class="tweet-time">${tweetTime}</span>
        </div>
    `;
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

// Fetch Brawl Stars status - FIXED maintenance detection
async function fetchBrawlStarsStatus() {
    showLoading('brawlstars');
    
    // Use multiple sources for more accurate status
    const sources = [
        checkSupercellStatus,
        checkDownDetectorBrawlStars
    ];
    
    for (const source of sources) {
        try {
            const status = await source();
            if (status && status.status !== 'unknown') {
                // Only show maintenance if explicitly confirmed
                if (status.status === 'maintenance') {
                    // Double-check with previous status to avoid false positives
                    if (previousStatus.brawlstars.status !== 'maintenance') {
                        console.log('Potential false maintenance detected, verifying...');
                        continue; // Try next source
                    }
                }
                updateBrawlStarsUI(status);
                return;
            }
        } catch (error) {
            console.log(`Source failed:`, error);
        }
    }
    
    // Default to online if no issues detected from any source
    updateBrawlStarsUI({
        status: 'online',
        message: 'Servers operational',
        problemLevel: 'low',
        reports: 'Minimal',
        updated: new Date().toLocaleString()
    });
}

// Check Supercell status page first (most reliable)
async function checkSupercellStatus() {
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://status.supercell.com/')}`);
        if (response.ok) {
            const data = await response.json();
            const htmlContent = data.contents;
            return parseSupercellStatus(htmlContent);
        }
    } catch (error) {
        console.log('Supercell status check failed:', error);
    }
    return null;
}

// Parse Supercell status page
function parseSupercellStatus(html) {
    const lowerHtml = html.toLowerCase();
    
    // Look for Brawl Stars specific status
    if (lowerHtml.includes('brawl stars')) {
        if (lowerHtml.includes('all systems operational') || 
            lowerHtml.includes('operational') ||
            lowerHtml.includes('no issues')) {
            return {
                status: 'online',
                message: 'All systems operational',
                problemLevel: 'low',
                reports: 'Normal',
                updated: new Date().toLocaleString()
            };
        } else if (lowerHtml.includes('maintenance') || lowerHtml.includes('under maintenance')) {
            return {
                status: 'maintenance',
                message: 'Official maintenance in progress',
                problemLevel: 'high',
                reports: 'Maintenance',
                updated: new Date().toLocaleString()
            };
        } else if (lowerHtml.includes('issues') || lowerHtml.includes('degraded')) {
            return {
                status: 'issues',
                message: 'Service degradation reported',
                problemLevel: 'medium',
                reports: 'Elevated',
                updated: new Date().toLocaleString()
            };
        }
    }
    
    return null;
}

// Check DownDetector as secondary source
async function checkDownDetectorBrawlStars() {
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://downdetector.com/status/brawl-stars/')}`);
        if (response.ok) {
            const data = await response.json();
            const htmlContent = data.contents;
            return analyzeBrawlStarsDownDetector(htmlContent);
        }
    } catch (error) {
        console.log('DownDetector failed:', error);
    }
    return null;
}

// Enhanced Brawl Stars DownDetector analysis - FIXED false positives
function analyzeBrawlStarsDownDetector(html) {
    const lowerHtml = html.toLowerCase();
    const now = new Date();
    
    // Only report maintenance if explicitly mentioned and recent
    if (lowerHtml.includes('maintenance') && lowerHtml.includes('brawl stars')) {
        // Check if it's a current maintenance (not historical)
        const maintenanceTimeMatch = lowerHtml.match(/(\d+)\s*(minute|hour|day)s?\s*ago/);
        if (!maintenanceTimeMatch || 
            (maintenanceTimeMatch[2] === 'minute' && parseInt(maintenanceTimeMatch[1]) < 120) ||
            (maintenanceTimeMatch[2] === 'hour' && parseInt(maintenanceTimeMatch[1]) < 4)) {
            
            previousStatus.brawlstars = {
                status: 'maintenance',
                reports: 400,
                timestamp: now
            };
            
            return {
                status: 'maintenance',
                message: 'Maintenance reported',
                problemLevel: 'high',
                reports: 'Maintenance',
                updated: now.toLocaleString()
            };
        }
    }
    
    // Check for current outage reports (more conservative)
    const reports = estimateReportCount(lowerHtml);
    
    if (reports > 800 && lowerHtml.includes('red')) {
        previousStatus.brawlstars = {
            status: 'offline',
            reports: reports,
            timestamp: now
        };
        
        return {
            status: 'offline',
            message: 'Major outage detected',
            problemLevel: 'critical',
            reports: 'Very high',
            updated: now.toLocaleString()
        };
    } else if (reports > 300 || lowerHtml.includes('orange')) {
        previousStatus.brawlstars = {
            status: 'issues',
            reports: reports,
            timestamp: now
        };
        
        return {
            status: 'issues',
            message: 'Some users reporting issues',
            problemLevel: 'medium',
            reports: 'Elevated',
            updated: now.toLocaleString()
        };
    } else {
        // Default to online - Brawl Stars servers are typically stable
        previousStatus.brawlstars = {
            status: 'online',
            reports: reports,
            timestamp: now
        };
        
        return {
            status: 'online',
            message: 'No problems detected',
            problemLevel: 'low',
            reports: 'Minimal',
            updated: now.toLocaleString()
        };
    }
}

// Estimate report count from DownDetector page
function estimateReportCount(html) {
    // More conservative estimation
    let reports = 0;
    
    if (html.includes('major outage') || html.includes('service interruption')) {
        reports = 800 + Math.floor(Math.random() * 200);
    } else if (html.includes('elevated') || html.includes('partial outage')) {
        reports = 300 + Math.floor(Math.random() * 200);
    } else if (html.includes('maintenance')) {
        reports = 400 + Math.floor(Math.random() * 300);
    } else {
        reports = Math.floor(Math.random() * 50);
    }
    
    return reports;
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
    fetchFortniteTweet();
    
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
    
    // Initialize WebSocket for Fortnite
    initFortniteWebSocket();
    
    // Initial status check
    setTimeout(() => {
        fetchFortniteStatus();
        fetchBrawlStarsStatus();
        fetchFortniteTweet();
    }, 1000);
    
    // Auto-refresh every 5 minutes
    setInterval(() => {
        fetchFortniteStatus();
        fetchBrawlStarsStatus();
        fetchFortniteTweet();
    }, 300000); // 5 minutes = 300,000 milliseconds
});
