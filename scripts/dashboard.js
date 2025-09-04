export class Dashboard {
    constructor() {
        this.activities = [];
        this.stats = {
            totalAnalyzed: 0,
            totalShortlisted: 0,
            avgScore: 0,
            activeJobs: 0
        };
    }

    addActivity(type, data) {
        const activity = {
            id: Date.now(),
            type: type,
            data: data,
            timestamp: new Date()
        };

        this.activities.unshift(activity); // Add to beginning
        
        // Keep only last 10 activities
        if (this.activities.length > 10) {
            this.activities = this.activities.slice(0, 10);
        }

        this.updateStats();
        this.displayRecentActivity();
    }

    updateStats() {
        // Calculate stats from all activities
        let totalAnalyzed = 0;
        let totalShortlisted = 0;
        let totalScore = 0;
        let scoreCount = 0;
        const activeJobs = new Set();

        this.activities.forEach(activity => {
            if (activity.type === 'bulk') {
                totalAnalyzed += activity.data.count;
                activeJobs.add(activity.data.jobTitle);
                
                activity.data.results.forEach(result => {
                    if (result.status === 'shortlisted') {
                        totalShortlisted++;
                    }
                    totalScore += result.scores.overall;
                    scoreCount++;
                });
            } else if (activity.type === 'single') {
                totalAnalyzed++;
                totalScore += activity.data.scores.overall;
                scoreCount++;
            }
        });

        this.stats = {
            totalAnalyzed: totalAnalyzed,
            totalShortlisted: totalShortlisted,
            avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
            activeJobs: activeJobs.size
        };

        this.displayStats();
    }

    displayStats() {
        document.getElementById('totalAnalyzed').textContent = this.stats.totalAnalyzed;
        document.getElementById('totalShortlisted').textContent = this.stats.totalShortlisted;
        document.getElementById('avgScore').textContent = `${this.stats.avgScore}%`;
        document.getElementById('activeJobs').textContent = this.stats.activeJobs;
    }

    displayRecentActivity() {
        const container = document.getElementById('recentActivity');
        
        if (this.activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                    </svg>
                    <p>No recent analysis found</p>
                    <small>Start by analyzing resumes to see activity here</small>
                </div>
            `;
            return;
        }

        const activitiesHTML = this.activities.map(activity => {
            return this.createActivityItem(activity);
        }).join('');

        container.innerHTML = activitiesHTML;
    }

    createActivityItem(activity) {
        const timeAgo = this.getTimeAgo(activity.timestamp);
        
        if (activity.type === 'bulk') {
            const avgScore = Math.round(
                activity.data.results.reduce((sum, result) => sum + result.scores.overall, 0) / 
                activity.data.results.length
            );
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect width="8" height="4" x="8" y="2" rx="1"></rect>
                        </svg>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">Bulk Analysis: ${activity.data.jobTitle}</div>
                        <div class="activity-meta">${activity.data.count} resumes analyzed • ${timeAgo}</div>
                    </div>
                    <div class="activity-score ${this.getScoreClass(avgScore)}">${avgScore}%</div>
                </div>
            `;
        } else if (activity.type === 'single') {
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">Single Analysis: ${activity.data.fileName}</div>
                        <div class="activity-meta">Individual resume analysis • ${timeAgo}</div>
                    </div>
                    <div class="activity-score ${this.getScoreClass(activity.data.scores.overall)}">${activity.data.scores.overall}%</div>
                </div>
            `;
        }
    }

    getScoreClass(score) {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-average';
        return 'score-poor';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
    }
}