// script.js
let currentUser = null;
let posts = [];
const curseWords = ['damn', 'hell', 'fuck', 'shit']; // Add more as needed
const logs = [];

function saveToLogs(action, data) {
    logs.push({
        timestamp: new Date().toISOString(),
        action,
        data
    });
    localStorage.setItem('logs', JSON.stringify(logs));
}

function login() {
    const username = document.getElementById('username').value.trim();
    if (username) {
        currentUser = username; // Case-sensitive username
        saveToLogs('login', { username });
    }
}

function createPost() {
    if (!currentUser) {
        alert('Please login first!');
        return;
    }
    
    const content = document.getElementById('postContent').value.trim();
    if (!content) return;

    const post = {
        id: Date.now(),
        username: currentUser,
        content,
        timestamp: new Date().toISOString(),
        views: 0,
        votes: 0,
        hideThreshold: 10, // Initial % needed to hide
        voteTimer: 60, // Initial seconds
        voters: new Set()
    };

    posts.unshift(post);
    saveToLogs('post_created', { postId: post.id, username: currentUser });
    document.getElementById('postContent').value = '';
    renderFeed();
}

function votePost(postId, vote) {
    if (!currentUser) {
        alert('Please login to vote!');
        return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post || post.voters.has(currentUser)) return;

    post.voters.add(currentUser);
    post.votes += vote ? 1 : -1;
    saveToLogs('vote', { postId, username: currentUser, vote });
    updatePostStatus(post);
    renderFeed();
}

function updatePostStatus(post) {
    post.views++;
    // Increase timer and threshold based on views
    post.voteTimer = Math.min(300, 60 + Math.floor(post.views / 10) * 30);
    post.hideThreshold = Math.min(50, 10 + Math.floor(post.views / 50) * 5);

    // Check for curse words
    const hasCurseWord = curseWords.some(word => 
        post.content.toLowerCase().includes(word)
    );

    if (hasCurseWord) {
        post.hideThreshold = 5; // Lower threshold for posts with curse words
    }

    // Check if post should be hidden
    const votePercentage = (post.votes / post.views) * 100;
    return votePercentage >= post.hideThreshold;
}

function renderPost(post, isLive = true) {
    const shouldHide = updatePostStatus(post);
    const container = document.createElement('div');
    container.className = `post ${shouldHide && isLive ? 'hidden' : ''}`;
    
    container.innerHTML = `
        <div class="post-header">
            <span>${post.username} - ${new Date(post.timestamp).toLocaleString()}</span>
            <span>Views: ${post.views}</span>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="vote-controls">
            <button onclick="votePost(${post.id}, true)">👍 ${post.votes}</button>
            <button onclick="votePost(${post.id}, false)">👎</button>
            <span>Hide threshold: ${post.hideThreshold}% (${post.voteTimer}s)</span>
        </div>
    `;
    
    return container;
}

function renderFeed() {
    const liveFeed = document.getElementById('live-feed');
    const allFeed = document.getElementById('all-feed');
    
    liveFeed.innerHTML = '';
    allFeed.innerHTML = '';

    posts.forEach(post => {
        liveFeed.appendChild(renderPost(post, true));
        allFeed.appendChild(renderPost(post, false));
    });
}

function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => 
        tab.classList.remove('active'));
    document.querySelectorAll('.feed-content').forEach(content => 
        content.classList.remove('active'));

    document.querySelector(`button[onclick="showTab('${tabName}')"]`)
        .classList.add('active');
    document.getElementById(`${tabName}-feed`)
        .classList.add('active');
}

// Load saved data
window.onload = () => {
    const savedLogs = localStorage.getItem('logs');
    if (savedLogs) logs.push(...JSON.parse(savedLogs));
};
