// Initialize Plotly charts and graphs
document.addEventListener('DOMContentLoaded', function() {
    // Accuracy chart
    if (document.getElementById('accuracy-chart')) {
        fetch('/api/prediction-accuracy')
            .then(response => response.json())
            .then(data => {
                const trace = {
                    x: data.weeks,
                    y: data.accuracy,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Prediction Accuracy'
                };

                const layout = {
                    title: 'Weekly Prediction Accuracy',
                    xaxis: {
                        title: 'Week'
                    },
                    yaxis: {
                        title: 'Accuracy (%)',
                        range: [0, 100]
                    }
                };

                Plotly.newPlot('accuracy-chart', [trace], layout);
            })
            .catch(error => console.error('Error loading accuracy chart:', error));
    }

    // Automatically fetch and render predictions on dashboard load
    if (document.getElementById('picks-grid')) {
        fetchWeeklyPredictions();
    }

    // Auto-refresh live scores every 30 seconds
    setInterval(fetchLiveScores, 30000);
});

function fetchWeeklyPredictions() {
    fetch('/api/weekly-predictions')
        .then(response => response.json())
        .then(data => {
            const picksGrid = document.getElementById('picks-grid');
            if (picksGrid && data.predictions) {
                picksGrid.innerHTML = '';
                data.predictions.forEach(prediction => {
                    const predictionCard = createPredictionCard(prediction);
                    picksGrid.appendChild(predictionCard);
                });
            }
        })
        .catch(error => console.error('Error fetching predictions:', error));
}

function createPredictionCard(prediction) {
    const card = document.createElement('div');
    card.className = 'prediction-card';
    card.innerHTML = `
        <div class="teams">
            <span class="team">${prediction.predicted_winner}</span>
        </div>
        <div class="confidence">
            Confidence: ${(prediction.confidence * 100).toFixed(1)}%
        </div>
        <div class="spread">
            Spread: ${prediction.predicted_spread ? prediction.predicted_spread.toFixed(1) : 'N/A'}
        </div>
    `;
    return card;
}

function fetchLiveScores() {
    fetch('/api/live-scores')
        .then(response => response.json())
        .then(data => {
            updateScoreDisplay(data);
        })
        .catch(error => console.error('Error fetching live scores:', error));
}

function updateScoreDisplay(data) {
    // Update any live score displays on the page
    console.log('Live scores updated:', data.last_updated);
    
    // Update live games if any
    if (data.live_games && data.live_games.length > 0) {
        console.log('Live games:', data.live_games);
    }
    
    // Update completed games
    if (data.completed_games && data.completed_games.length > 0) {
        console.log('Recent completed games:', data.completed_games);
    }
}

// Utility functions for predictions
function makePrediction(gameId) {
    fetch(`/api/make_prediction/${gameId}`, {method: 'POST'})
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert('Error making prediction: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error making prediction:', error);
            alert('Error making prediction');
        });
}

function refreshScores() {
    const statusDiv = document.getElementById('scores-status');
    if (statusDiv) {
        statusDiv.innerHTML = 'Refreshing scores...';
    }
    
    fetch('/api/refresh_scores')
        .then(response => response.json())
        .then(data => {
            if (statusDiv) {
                if (data.success) {
                    statusDiv.innerHTML = '✅ Scores updated successfully!';
                    setTimeout(() => location.reload(), 1000);
                } else {
                    statusDiv.innerHTML = '❌ Error: ' + data.error;
                }
            }
        })
        .catch(error => {
            if (statusDiv) {
                statusDiv.innerHTML = '❌ Network error occurred';
            }
            console.error('Error refreshing scores:', error);
        });
}

// Reddit picks functionality
function loadRedditPicks(gameId) {
    const redditSection = document.getElementById(`reddit-picks-${gameId}`);
    if (redditSection) {
        redditSection.innerHTML = '<div class="loading">Loading Reddit picks...</div>';
    }
    
    fetch(`/api/reddit-analysis/${gameId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayRedditPicks(gameId, data.reddit_picks, data.overall_sentiment);
            } else {
                redditSection.innerHTML = `<div class="error">Error: ${data.error}</div>`;
            }
        })
        .catch(error => {
            console.error('Error loading Reddit picks:', error);
            if (redditSection) {
                redditSection.innerHTML = '<div class="error">Failed to load Reddit data</div>';
            }
        });
}

function displayRedditPicks(gameId, picks, sentiment) {
    const redditSection = document.getElementById(`reddit-picks-${gameId}`);
    if (!redditSection) return;
    
    const confidence = (picks.confidence * 100).toFixed(1);
    const totalMentions = picks.total_mentions;
    
    redditSection.innerHTML = `
        <div class="reddit-data">
            <h4>📊 Reddit Community Picks</h4>
            <div class="reddit-stats">
                <p><strong>Reddit Favorite:</strong> ${picks.reddit_favorite}</p>
                <p><strong>Confidence:</strong> ${confidence}%</p>
                <p><strong>Total Mentions:</strong> ${totalMentions}</p>
                <div class="mention-breakdown">
                    <span class="home-mentions">Home: ${picks.home_mentions}</span>
                    <span class="away-mentions">Away: ${picks.away_mentions}</span>
                </div>
            </div>
            <div class="sentiment-data">
                <p><strong>Community Sentiment:</strong> ${sentiment.confidence_level}</p>
                <p><strong>Posts Analyzed:</strong> ${sentiment.posts_analyzed || 0}</p>
            </div>
        </div>
    `;
}

function loadOverallRedditSentiment() {
    const summaryContent = document.getElementById('reddit-summary-content');
    if (summaryContent) {
        summaryContent.innerHTML = '<div class="loading">Analyzing Reddit sentiment...</div>';
    }
    
    fetch('/api/reddit-picks')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOverallRedditSentiment(data.overall_sentiment, data.game_picks);
            } else {
                summaryContent.innerHTML = `<div class="error">Error: ${data.error}</div>`;
            }
        })
        .catch(error => {
            console.error('Error loading overall Reddit sentiment:', error);
            if (summaryContent) {
                summaryContent.innerHTML = '<div class="error">Failed to load Reddit analysis</div>';
            }
        });
}

function displayOverallRedditSentiment(sentiment, gamePicks) {
    const summaryContent = document.getElementById('reddit-summary-content');
    if (!summaryContent) return;
    
    const totalMentions = sentiment.total_mentions || 0;
    const confidenceLevel = sentiment.confidence_level || 'unknown';
    const postsAnalyzed = sentiment.posts_analyzed || 0;
    
    // Get top teams by mentions
    const teamPicks = sentiment.team_picks || {};
    const topTeams = Object.entries(teamPicks)
        .sort((a, b) => (b[1].mentions || 0) - (a[1].mentions || 0))
        .slice(0, 5);
    
    let topTeamsHtml = '';
    if (topTeams.length > 0) {
        topTeamsHtml = `
            <div class="top-teams">
                <h4>Most Mentioned Teams:</h4>
                <ul>
                    ${topTeams.map(([team, data]) => 
                        `<li>${team}: ${data.mentions} mentions (Score: ${data.total_score})</li>`
                    ).join('')}
                </ul>
            </div>
        `;
    }
    
    summaryContent.innerHTML = `
        <div class="reddit-summary">
            <h3>🔥 Live Reddit Sentiment Analysis</h3>
            <div class="summary-stats">
                <div class="stat">
                    <span class="label">Total NFL Mentions:</span>
                    <span class="value">${totalMentions}</span>
                </div>
                <div class="stat">
                    <span class="label">Community Confidence:</span>
                    <span class="value">${confidenceLevel}</span>
                </div>
                <div class="stat">
                    <span class="label">Posts Analyzed:</span>
                    <span class="value">${postsAnalyzed}</span>
                </div>
            </div>
            ${topTeamsHtml}
            <div class="subreddit-info">
                <p>Data sourced from r/nfl and r/NFLbets</p>
                <p>Updated: ${new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    `;
}

// Enhanced analysis functionality
function fetchEnhancedAnalysis() {
    const btn = document.getElementById('enhanced-analysis-btn');
    if (btn) {
        btn.textContent = 'Loading Enhanced Analysis...';
        btn.disabled = true;
    }

    fetch('/api/enhanced-analysis')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayEnhancedAnalysis(data.enhanced_analysis);
            } else {
                console.error('Enhanced analysis failed:', data.error);
                alert('Failed to load enhanced analysis: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching enhanced analysis:', error);
            alert('Error fetching enhanced analysis: ' + error.message);
        })
        .finally(() => {
            if (btn) {
                btn.textContent = 'Get Enhanced Analysis';
                btn.disabled = false;
            }
        });
}

function displayEnhancedAnalysis(analysisData) {
    const container = document.getElementById('enhanced-analysis-container');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'enhanced-analysis-container';
        newContainer.className = 'enhanced-analysis';
        document.querySelector('.container').appendChild(newContainer);
    }
    
    const finalContainer = document.getElementById('enhanced-analysis-container');
    finalContainer.innerHTML = `
        <h3>Enhanced Analysis (ESPN + Reddit + BallDontLie)</h3>
        <div class="analysis-grid">
            ${analysisData.map(game => `
                <div class="enhanced-game-card">
                    <h4>${game.home_team} vs ${game.away_team}</h4>
                    <p><strong>Date:</strong> ${new Date(game.game_date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> ${game.status}</p>
                    
                    <div class="analysis-section">
                        <h5>Reddit Analysis</h5>
                        <p><strong>Reddit Favorite:</strong> ${game.reddit_analysis.reddit_favorite}</p>
                        <p><strong>Confidence:</strong> ${(game.reddit_analysis.confidence * 100).toFixed(1)}%</p>
                        <p><strong>Total Mentions:</strong> ${game.reddit_analysis.total_mentions}</p>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>BallDontLie Data</h5>
                        <p><strong>Home Team:</strong> ${game.balldontlie_home ? 'Data Available' : 'No Data'}</p>
                        <p><strong>Away Team:</strong> ${game.balldontlie_away ? 'Data Available' : 'No Data'}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}