import fetch from 'node-fetch';

export interface RedditPost {
  title: string;
  score: number;
  upvoteRatio: number;
  numComments: number;
  content: string;
  created: number;
}

export interface RedditComment {
  body: string;
  score: number;
  created: number;
}

export interface SentimentResult {
  positive: number;
  negative: number;
  neutral: number;
  overall: number; // -1 to 1
  confidence: number;
  keyPhrases: string[];
}

export class RedditSentimentAnalyzer {
  private readonly userAgent = 'NFLAnalytics/1.0 (NFL Game Prediction Tool)';
  
  // NFL team subreddit mapping
  private readonly teamSubreddits: Record<string, string> = {
    'ARI': 'AZCardinals',
    'ATL': 'falcons',
    'BAL': 'ravens',
    'BUF': 'buffalobills',
    'CAR': 'panthers',
    'CHI': 'CHIBears',
    'CIN': 'bengals',
    'CLE': 'browns',
    'DAL': 'cowboys',
    'DEN': 'DenverBroncos',
    'DET': 'detroitlions',
    'GB': 'GreenBayPackers',
    'HOU': 'Texans',
    'IND': 'Colts',
    'JAX': 'Jaguars',
    'KC': 'KansasCityChiefs',
    'LV': 'raiders',
    'LAC': 'chargers',
    'LAR': 'losangelesrams',
    'MIA': 'miamidolphins',
    'MIN': 'minnesotavikings',
    'NE': 'Patriots',
    'NO': 'Saints',
    'NYG': 'NYGiants',
    'NYJ': 'nyjets',
    'PHI': 'eagles',
    'PIT': 'steelers',
    'SF': '49ers',
    'SEA': 'Seahawks',
    'TB': 'buccaneers',
    'TEN': 'Tennesseetitans',
    'WAS': 'commanders'
  };

  async analyzeTeamSentiment(teamId: string, opponentId?: string): Promise<SentimentResult> {
    const subreddit = this.teamSubreddits[teamId];
    if (!subreddit) {
      throw new Error(`No subreddit found for team ${teamId}`);
    }

    try {
      // Get hot posts from team subreddit
      const posts = await this.getSubredditPosts(subreddit, 'hot', 25);
      
      // Filter posts relevant to upcoming game or recent team performance
      const relevantPosts = this.filterRelevantPosts(posts, opponentId);
      
      // Get comments for top posts
      const comments = await this.getPostComments(subreddit, relevantPosts.slice(0, 5));
      
      // Analyze sentiment
      const postSentiment = this.analyzePosts(relevantPosts);
      const commentSentiment = this.analyzeComments(comments);
      
      // Combine results
      return this.combineSentimentResults(postSentiment, commentSentiment);
      
    } catch (error) {
      console.error(`Error analyzing sentiment for ${teamId}:`, error);
      // Return neutral sentiment on error
      return {
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34,
        overall: 0,
        confidence: 0,
        keyPhrases: []
      };
    }
  }

  private async getSubredditPosts(subreddit: string, sort: 'hot' | 'new' | 'top' = 'hot', limit = 25): Promise<RedditPost[]> {
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    return data.data.children.map((child: any) => ({
      title: child.data.title,
      score: child.data.score,
      upvoteRatio: child.data.upvote_ratio,
      numComments: child.data.num_comments,
      content: child.data.selftext || '',
      created: child.data.created_utc
    }));
  }

  private filterRelevantPosts(posts: RedditPost[], opponentId?: string): RedditPost[] {
    const gameKeywords = [
      'game', 'matchup', 'vs', 'against', 'prediction', 'preview',
      'injury', 'lineup', 'roster', 'coach', 'strategy', 'gameplan'
    ];
    
    const teamKeywords = opponentId ? [
      this.teamSubreddits[opponentId]?.toLowerCase(),
      this.getTeamNicknames(opponentId)
    ].flat().filter(Boolean) : [];

    return posts.filter(post => {
      const text = (post.title + ' ' + post.content).toLowerCase();
      
      // Must contain game-related keywords
      const hasGameKeywords = gameKeywords.some(keyword => text.includes(keyword));
      
      // Bonus points for mentioning opponent
      const hasOpponentKeywords = teamKeywords.length === 0 || 
        teamKeywords.some(keyword => text.includes(keyword));
      
      // Filter out posts that are too old (more than 7 days)
      const weekAgo = Date.now() / 1000 - (7 * 24 * 60 * 60);
      const isRecent = post.created > weekAgo;
      
      return hasGameKeywords && isRecent && post.score > 5;
    });
  }

  private getTeamNicknames(teamId: string): string[] {
    const nicknames: Record<string, string[]> = {
      'DAL': ['cowboys', 'dallas'],
      'PHI': ['eagles', 'philadelphia', 'philly'],
      'WAS': ['commanders', 'washington'],
      'NYG': ['giants', 'new york giants'],
      'GB': ['packers', 'green bay'],
      'KC': ['chiefs', 'kansas city'],
      'SF': ['niners', '49ers', 'san francisco'],
      'NE': ['patriots', 'pats', 'new england'],
      // Add more as needed
    };
    
    return nicknames[teamId] || [];
  }

  private async getPostComments(subreddit: string, posts: RedditPost[]): Promise<RedditComment[]> {
    // For demo purposes, return empty array
    // In real implementation, would fetch comments for each post
    return [];
  }

  private analyzePosts(posts: RedditPost[]): SentimentResult {
    if (posts.length === 0) {
      return { positive: 0.33, negative: 0.33, neutral: 0.34, overall: 0, confidence: 0, keyPhrases: [] };
    }

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const keyPhrases: string[] = [];

    posts.forEach(post => {
      const text = (post.title + ' ' + post.content).toLowerCase();
      const sentiment = this.simpleTextSentiment(text);
      
      if (sentiment > 0.1) positiveCount++;
      else if (sentiment < -0.1) negativeCount++;
      else neutralCount++;

      // Extract key phrases (simplified)
      const phrases = this.extractKeyPhrases(text);
      keyPhrases.push(...phrases);
    });

    const total = posts.length;
    const positive = positiveCount / total;
    const negative = negativeCount / total;
    const neutral = neutralCount / total;
    const overall = (positiveCount - negativeCount) / total;

    return {
      positive,
      negative,
      neutral,
      overall,
      confidence: Math.min(total / 10, 1), // Higher confidence with more posts
      keyPhrases: Array.from(new Set(keyPhrases)).slice(0, 10)
    };
  }

  private analyzeComments(comments: RedditComment[]): SentimentResult {
    // Similar to analyzePosts but for comments
    return { positive: 0.33, negative: 0.33, neutral: 0.34, overall: 0, confidence: 0, keyPhrases: [] };
  }

  private combineSentimentResults(postSentiment: SentimentResult, commentSentiment: SentimentResult): SentimentResult {
    // Weight posts more heavily than comments (70/30 split)
    const postWeight = 0.7;
    const commentWeight = 0.3;

    return {
      positive: postSentiment.positive * postWeight + commentSentiment.positive * commentWeight,
      negative: postSentiment.negative * postWeight + commentSentiment.negative * commentWeight,
      neutral: postSentiment.neutral * postWeight + commentSentiment.neutral * commentWeight,
      overall: postSentiment.overall * postWeight + commentSentiment.overall * commentWeight,
      confidence: Math.max(postSentiment.confidence, commentSentiment.confidence),
      keyPhrases: Array.from(new Set(postSentiment.keyPhrases.concat(commentSentiment.keyPhrases)))
    };
  }

  private simpleTextSentiment(text: string): number {
    // Simple keyword-based sentiment analysis
    const positiveWords = [
      'confident', 'excited', 'optimistic', 'strong', 'great', 'excellent', 'win', 'victory',
      'dominate', 'crush', 'destroy', 'beast', 'amazing', 'fantastic', 'love', 'best'
    ];
    
    const negativeWords = [
      'worried', 'concerned', 'terrible', 'awful', 'lose', 'losing', 'suck', 'horrible',
      'disaster', 'pathetic', 'worst', 'hate', 'frustrated', 'disappointed', 'injured'
    ];

    let score = 0;
    const words = text.split(/\s+/);

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    // Normalize by text length
    return Math.max(-1, Math.min(1, score / Math.max(words.length / 10, 1)));
  }

  private extractKeyPhrases(text: string): string[] {
    // Extract meaningful phrases about team performance
    const patterns = [
      /(?:our|the)?\s*(defense|offense|special teams?)\s+(?:is|looks?|seems?)\s+(\w+)/gi,
      /(\w+)\s+(?:injury|injured|hurt)/gi,
      /(quarterback|qb|running back|rb|wide receiver|wr)\s+(?:is|looks?)\s+(\w+)/gi,
      /(coaching|coach)\s+(?:is|seems?|looks?)\s+(\w+)/gi
    ];

    const phrases: string[] = [];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        phrases.push(match[0].trim());
      }
    });

    return phrases;
  }
}

// Export singleton instance
export const redditAnalyzer = new RedditSentimentAnalyzer();