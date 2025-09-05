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

// Auto-populate comprehensive Reddit analysis
function autoPopulateRedditPicks() {
    const btn = document.getElementById('auto-populate-btn');
    if (btn) {
        btn.textContent = 'Analyzing Reddit... (This may take 30-60 seconds)';
        btn.disabled = true;
    }

    // Show progress indicator
    showAnalysisProgress();

    fetch('/api/auto-populate-reddit')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayComprehensiveAnalysis(data);
                showSuccessMessage(`Analysis complete! Analyzed ${data.analysis_summary?.total_posts_analyzed || 'many'} posts from ${data.analysis_summary?.subreddits_covered || 'multiple'} subreddits.`);
            } else {
                console.error('Auto-populate failed:', data.error);
                alert('Failed to auto-populate Reddit analysis: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error auto-populating Reddit picks:', error);
            alert('Error auto-populating Reddit picks: ' + error.message);
        })
        .finally(() => {
            if (btn) {
                btn.textContent = '🚀 Auto-Populate Comprehensive Analysis';
                btn.disabled = false;
            }
            hideAnalysisProgress();
        });
}

function showAnalysisProgress() {
    const progressDiv = document.createElement('div');
    progressDiv.id = 'analysis-progress';
    progressDiv.className = 'analysis-progress';
    progressDiv.innerHTML = `
        <div class="progress-content">
            <div class="spinner"></div>
            <h3>Comprehensive Reddit Analysis in Progress</h3>
            <p>Analyzing posts from r/nfl, r/NFLbets, r/sportsbook, and more...</p>
            <div class="progress-steps">
                <div class="step active">Fetching posts</div>
                <div class="step">Analyzing sentiment</div>
                <div class="step">Processing picks</div>
                <div class="step">Generating insights</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(progressDiv);
    
    // Animate progress steps
    let stepIndex = 0;
    const steps = progressDiv.querySelectorAll('.step');
    const progressInterval = setInterval(() => {
        if (stepIndex < steps.length) {
            steps[stepIndex].classList.add('active');
            stepIndex++;
        } else {
            clearInterval(progressInterval);
        }
    }, 8000);
}

function hideAnalysisProgress() {
    const progressDiv = document.getElementById('analysis-progress');
    if (progressDiv) {
        progressDiv.remove();
    }
}

function displayComprehensiveAnalysis(data) {
    const container = document.getElementById('comprehensive-analysis-container') || createComprehensiveContainer();
    
    const summary = data.analysis_summary || {};
    const analysis = data.comprehensive_analysis || {};
    const gameSpecific = data.game_specific_picks || [];
    
    container.innerHTML = `
        <h3>🏈 Comprehensive Reddit NFL Analysis</h3>
        
        <div class="analysis-overview">
            <div class="metric-card">
                <h4>${summary.total_posts_analyzed || 0}</h4>
                <p>Posts Analyzed</p>
            </div>
            <div class="metric-card">
                <h4>${summary.subreddits_covered || 0}</h4>
                <p>Subreddits</p>
            </div>
            <div class="metric-card">
                <h4>${summary.team_mentions_found || 0}</h4>
                <p>Team Mentions</p>
            </div>
            <div class="metric-card">
                <h4>${summary.confidence_level || 'Unknown'}</h4>
                <p>Confidence Level</p>
            </div>
        </div>
        
        <div class="subreddit-breakdown">
            <h4>📊 Data Sources</h4>
            <div class="source-grid">
                ${(analysis.data_sources || []).map(source => `
                    <div class="source-card">
                        <strong>r/${source.subreddit}</strong>
                        <p>${source.posts_found} posts found</p>
                        <p>${source.relevant_posts} relevant</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="top-picks">
            <h4>🔥 Top Reddit Picks</h4>
            <div class="picks-grid">
                ${Object.entries(analysis.team_picks || {})
                    .sort(([,a], [,b]) => (b.popularity || 0) - (a.popularity || 0))
                    .slice(0, 8)
                    .map(([team, data]) => `
                        <div class="pick-card">
                            <h5>${team}</h5>
                            <p><strong>Mentions:</strong> ${data.mentions}</p>
                            <p><strong>Score:</strong> ${(data.popularity || 0).toFixed(1)}</p>
                            <p><strong>Sources:</strong> ${Object.keys(data.subreddit_sources || {}).length} subreddits</p>
                            ${data.confidence_indicators?.includes('high') ? '<span class="high-confidence">🔥 High Confidence</span>' : ''}
                        </div>
                    `).join('')}
            </div>
        </div>
        
        <div class="game-specific">
            <h4>🎯 Game-Specific Analysis</h4>
            <div class="games-grid">
                ${gameSpecific.map(game => `
                    <div class="game-analysis-card">
                        <h5>${game.away_team} @ ${game.home_team}</h5>
                        <p><strong>Reddit Favorite:</strong> ${game.picks?.reddit_favorite || 'Even'}</p>
                        <p><strong>Confidence:</strong> ${((game.picks?.confidence || 0) * 100).toFixed(1)}%</p>
                        <p><strong>Total Mentions:</strong> ${game.picks?.total_mentions || 0}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function createComprehensiveContainer() {
    const container = document.createElement('div');
    container.id = 'comprehensive-analysis-container';
    container.className = 'comprehensive-analysis';
    document.querySelector('.container').appendChild(container);
    return container;
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// Background Reddit processing functionality
function checkRedditBackgroundStatus() {
    fetch('/api/reddit-background-status')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateBackgroundStatusDisplay(data);
            }
        })
        .catch(error => console.error('Error checking background status:', error));
}

function updateBackgroundStatusDisplay(statusData) {
    const statusContainer = document.getElementById('reddit-background-status');
    if (!statusContainer) {
        // Create status container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'reddit-background-status';
        newContainer.className = 'background-status';
        document.querySelector('.reddit-summary').appendChild(newContainer);
    }
    
    const container = document.getElementById('reddit-background-status');
    container.innerHTML = `
        <div class="status-card">
            <h4>🔄 Auto Reddit Analysis Status</h4>
            <div class="status-grid">
                <div class="status-item">
                    <span class="status-label">Status:</span>
                    <span class="status-value ${statusData.status.toLowerCase()}">${statusData.status}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Posts Analyzed:</span>
                    <span class="status-value">${statusData.total_posts_analyzed.toLocaleString()}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Comments Analyzed:</span>
                    <span class="status-value">${statusData.total_comments_analyzed.toLocaleString()}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Last Updated:</span>
                    <span class="status-value">${statusData.last_updated ? new Date(statusData.last_updated).toLocaleString() : 'Never'}</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Update Frequency:</span>
                    <span class="status-value">${statusData.update_frequency}</span>
                </div>
            </div>
            <div class="status-actions">
                <button onclick="getCachedRedditData()" class="cache-btn">📊 Get Latest Cached Data</button>
                <button onclick="forceRedditUpdate()" class="force-update-btn">🔄 Force Update Now</button>
            </div>
        </div>
    `;
}

function getCachedRedditData() {
    const btn = document.querySelector('.cache-btn');
    if (btn) {
        btn.textContent = '⏳ Loading Cached Data...';
        btn.disabled = true;
    }

    fetch('/api/reddit-comprehensive-cached')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayCachedRedditAnalysis(data);
            } else {
                alert('Failed to load cached data: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error fetching cached data:', error);
            alert('Error fetching cached data: ' + error.message);
        })
        .finally(() => {
            if (btn) {
                btn.textContent = '📊 Get Latest Cached Data';
                btn.disabled = false;
            }
        });
}

function forceRedditUpdate() {
    const btn = document.querySelector('.force-update-btn');
    if (btn) {
        btn.textContent = '⏳ Updating... (may take 2-3 minutes)';
        btn.disabled = true;
    }

    fetch('/api/reddit-force-update')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Update completed! Analyzed ${data.total_posts} posts and ${data.total_comments} comments.`);
                // Refresh status
                checkRedditBackgroundStatus();
            } else {
                alert('Update failed: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error forcing update:', error);
            alert('Error forcing update: ' + error.message);
        })
        .finally(() => {
            if (btn) {
                btn.textContent = '🔄 Force Update Now';
                btn.disabled = false;
            }
        });
}

function displayCachedRedditAnalysis(data) {
    const container = document.getElementById('cached-reddit-container') || 
                     document.createElement('div');
    container.id = 'cached-reddit-container';
    container.className = 'cached-reddit-analysis';
    
    if (!document.getElementById('cached-reddit-container')) {
        document.querySelector('.reddit-summary').appendChild(container);
    }
    
    const cachedData = data.cached_data.comprehensive_analysis;
    
    container.innerHTML = `
        <h3>📈 Latest Cached Reddit Analysis</h3>
        <div class="analysis-summary">
            <p><strong>Data Freshness:</strong> ${new Date(data.data_freshness).toLocaleString()}</p>
            <p><strong>Total Posts:</strong> ${data.total_posts.toLocaleString()}</p>
            <p><strong>Total Comments:</strong> ${data.total_comments.toLocaleString()}</p>
            <p><strong>Auto-Updated:</strong> Every hour in background</p>
        </div>
        
        <div class="team-picks-comprehensive">
            <h4>🏈 Team Sentiment Analysis</h4>
            ${Object.entries(cachedData.team_picks || {}).map(([team, data]) => `
                <div class="team-sentiment-card">
                    <h5>${team}</h5>
                    <p><strong>Mentions:</strong> ${data.mentions}</p>
                    <p><strong>Total Score:</strong> ${data.total_score}</p>
                    <p><strong>Popularity:</strong> ${data.popularity.toFixed(1)}</p>
                </div>
            `).join('')}
        </div>
        
        <div class="sentiment-overview">
            <h4>📊 Overall Sentiment</h4>
            <p><strong>Sentiment Score:</strong> ${(cachedData.sentiment_score * 100).toFixed(1)}%</p>
            <p><strong>Confidence Level:</strong> ${cachedData.confidence_level}</p>
            <p><strong>Posts Analyzed:</strong> ${cachedData.posts_analyzed || 0}</p>
        </div>
    `;
}

// Auto-check status on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check background status every 30 seconds
    checkRedditBackgroundStatus();
    setInterval(checkRedditBackgroundStatus, 30000);
});