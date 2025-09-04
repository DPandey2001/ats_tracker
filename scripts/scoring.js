export class ScoringEngine {
    constructor() {
        this.weights = {
            experience: 0.35,
            skills: 0.30,
            projects: 0.20,
            summary: 0.15
        };
    }

    calculateScores(jobData, resumeSections, aiAnalysis) {
        const scores = {
            experience: Math.max(0, Math.min(100, aiAnalysis.experienceScore || 0)),
            skills: Math.max(0, Math.min(100, aiAnalysis.skillsScore || 0)),
            projects: Math.max(0, Math.min(100, aiAnalysis.projectsScore || 0)),
            summary: Math.max(0, Math.min(100, aiAnalysis.summaryScore || 0))
        };

        // Calculate weighted overall score
        const overall = Math.round(
            (scores.experience * this.weights.experience) +
            (scores.skills * this.weights.skills) +
            (scores.projects * this.weights.projects) +
            (scores.summary * this.weights.summary)
        );

        return {
            ...scores,
            overall: overall,
            breakdown: this.createScoreBreakdown(scores),
            recommendation: this.getRecommendation(overall)
        };
    }

    createScoreBreakdown(scores) {
        return {
            experience: {
                score: scores.experience,
                weight: this.weights.experience,
                contribution: Math.round(scores.experience * this.weights.experience)
            },
            skills: {
                score: scores.skills,
                weight: this.weights.skills,
                contribution: Math.round(scores.skills * this.weights.skills)
            },
            projects: {
                score: scores.projects,
                weight: this.weights.projects,
                contribution: Math.round(scores.projects * this.weights.projects)
            },
            summary: {
                score: scores.summary,
                weight: this.weights.summary,
                contribution: Math.round(scores.summary * this.weights.summary)
            }
        };
    }

    getRecommendation(overallScore) {
        if (overallScore >= 80) {
            return 'Excellent match - Highly recommended for interview';
        } else if (overallScore >= 65) {
            return 'Good match - Consider for interview';
        } else if (overallScore >= 45) {
            return 'Moderate match - May need additional screening';
        } else {
            return 'Low match - Consider other candidates first';
        }
    }

    calculateSectionScore(sectionText, jobRequirements, sectionType) {
        if (!sectionText || sectionText.trim().length === 0) {
            return 0;
        }

        const keywords = this.extractKeywords(jobRequirements, sectionType);
        const sectionLower = sectionText.toLowerCase();
        
        let matchCount = 0;
        keywords.forEach(keyword => {
            if (sectionLower.includes(keyword.toLowerCase())) {
                matchCount++;
            }
        });

        const score = Math.min(100, (matchCount / keywords.length) * 100);
        return Math.round(score);
    }

    extractKeywords(jobText, sectionType) {
        const commonSkills = [
            'javascript', 'python', 'java', 'react', 'angular', 'node.js', 'vue.js',
            'aws', 'azure', 'docker', 'kubernetes', 'mysql', 'postgresql', 'mongodb',
            'git', 'agile', 'scrum', 'ci/cd', 'devops', 'machine learning', 'ai'
        ];

        const jobWords = jobText.toLowerCase().split(/\s+/);
        const keywords = [];

        // Extract technical skills
        commonSkills.forEach(skill => {
            if (jobWords.some(word => word.includes(skill))) {
                keywords.push(skill);
            }
        });

        // Extract other relevant keywords based on section type
        if (sectionType === 'experience') {
            const experienceKeywords = ['years', 'lead', 'manage', 'develop', 'design', 'implement'];
            experienceKeywords.forEach(keyword => {
                if (jobWords.includes(keyword)) {
                    keywords.push(keyword);
                }
            });
        }

        return keywords.length > 0 ? keywords : ['relevant', 'experience', 'skills'];
    }
}