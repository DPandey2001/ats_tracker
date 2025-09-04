export class WordMatcher {
    constructor() {
        this.technicalSkills = [
            'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'typescript',
            'aws', 'azure', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'mysql',
            'html', 'css', 'sass', 'less', 'webpack', 'git', 'github', 'gitlab',
            'agile', 'scrum', 'devops', 'ci/cd', 'jenkins', 'terraform', 'ansible',
            'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'pandas',
            'spring', 'django', 'flask', 'express', 'fastapi', 'laravel', 'rails'
        ];

        this.experienceTerms = [
            'years', 'experience', 'senior', 'lead', 'manager', 'director', 'architect',
            'principal', 'developed', 'designed', 'implemented', 'managed', 'led',
            'created', 'built', 'maintained', 'optimized', 'scaled', 'deployed'
        ];

        this.softSkills = [
            'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
            'creative', 'adaptable', 'collaborative', 'mentoring', 'training'
        ];
    }

    analyzeWordMatching(jobData, resumeSections) {
        // Extract all keywords from job description
        const jobKeywords = this.extractJobKeywords(jobData);
        
        // Extract all words from resume sections
        const resumeWords = this.extractResumeWords(resumeSections);
        
        // Perform matching analysis
        const matched = [];
        const missing = [];
        const partial = [];
        const suggestions = [];

        jobKeywords.forEach(keyword => {
            const matchResult = this.findKeywordMatch(keyword, resumeWords);
            
            if (matchResult.exact) {
                matched.push(keyword);
            } else if (matchResult.partial) {
                partial.push(keyword);
            } else {
                missing.push(keyword);
            }
        });

        // Generate suggestions based on missing keywords
        missing.forEach(missingKeyword => {
            const suggestion = this.generateSuggestion(missingKeyword);
            if (suggestion) {
                suggestions.push(suggestion);
            }
        });

        // Add contextual suggestions
        suggestions.push(...this.getContextualSuggestions(jobData, resumeSections));

        return {
            matched: matched,
            missing: missing,
            partial: partial,
            suggestions: [...new Set(suggestions)], // Remove duplicates
            summary: {
                totalKeywords: jobKeywords.length,
                totalMatched: matched.length,
                totalPartial: partial.length,
                totalMissing: missing.length,
                matchPercentage: Math.round((matched.length / jobKeywords.length) * 100)
            },
            sectionAnalysis: this.analyzeSectionMatching(jobKeywords, resumeSections)
        };
    }

    extractJobKeywords(jobData) {
        const allText = `${jobData.title} ${jobData.description} ${jobData.skills.join(' ')}`;
        const words = this.cleanAndTokenize(allText);
        
        // Filter for meaningful keywords
        const keywords = words.filter(word => {
            return word.length > 2 && 
                   !this.isStopWord(word) && 
                   (this.isTechnicalTerm(word) || this.isImportantTerm(word));
        });

        // Add explicit skills
        jobData.skills.forEach(skill => {
            const cleanSkill = skill.trim().toLowerCase();
            if (!keywords.includes(cleanSkill)) {
                keywords.push(cleanSkill);
            }
        });

        return [...new Set(keywords)]; // Remove duplicates
    }

    extractResumeWords(resumeSections) {
        const allResumeText = Object.values(resumeSections).join(' ').toLowerCase();
        return this.cleanAndTokenize(allResumeText);
    }

    cleanAndTokenize(text) {
        return text.toLowerCase()
                  .replace(/[^\w\s.-]/g, ' ')
                  .split(/\s+/)
                  .filter(word => word.length > 0)
                  .map(word => word.trim());
    }

    findKeywordMatch(keyword, resumeWords) {
        const keywordLower = keyword.toLowerCase();
        
        // Exact match
        if (resumeWords.includes(keywordLower)) {
            return { exact: true, partial: false };
        }

        // Partial match (contains or is contained)
        const partialMatch = resumeWords.some(word => 
            word.includes(keywordLower) || keywordLower.includes(word)
        );

        // Fuzzy match for similar terms
        const fuzzyMatch = resumeWords.some(word => 
            this.calculateSimilarity(keywordLower, word) > 0.7
        );

        return { 
            exact: false, 
            partial: partialMatch || fuzzyMatch 
        };
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    generateSuggestion(missingKeyword) {
        // Generate contextual suggestions for missing keywords
        const synonyms = {
            'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
            'python': ['py', 'python3', 'django', 'flask'],
            'react': ['reactjs', 'react.js', 'jsx', 'hooks'],
            'node.js': ['nodejs', 'node', 'npm', 'express'],
            'aws': ['amazon web services', 'ec2', 's3', 'lambda'],
            'docker': ['containerization', 'containers', 'dockerfile'],
            'sql': ['database', 'queries', 'rdbms', 'mysql', 'postgresql']
        };

        const keyword = missingKeyword.toLowerCase();
        for (const [key, values] of Object.entries(synonyms)) {
            if (keyword.includes(key)) {
                return values[Math.floor(Math.random() * values.length)];
            }
        }

        return null;
    }

    getContextualSuggestions(jobData, resumeSections) {
        const suggestions = [];
        
        // Analyze job level and suggest appropriate terms
        if (jobData.title.toLowerCase().includes('senior')) {
            suggestions.push('leadership', 'mentoring', 'architecture');
        }
        
        if (jobData.title.toLowerCase().includes('lead')) {
            suggestions.push('team management', 'project planning', 'stakeholder communication');
        }

        // Suggest based on missing technical depth
        if (!resumeSections.projects || resumeSections.projects.length < 50) {
            suggestions.push('portfolio projects', 'github contributions', 'open source');
        }

        return suggestions;
    }

    analyzeSectionMatching(jobKeywords, resumeSections) {
        const sectionAnalysis = {};
        
        Object.keys(resumeSections).forEach(sectionName => {
            if (sectionName === 'fullText') return;
            
            const sectionText = resumeSections[sectionName] || '';
            const sectionWords = this.cleanAndTokenize(sectionText);
            
            const sectionMatches = jobKeywords.filter(keyword => 
                sectionWords.includes(keyword.toLowerCase())
            );

            sectionAnalysis[sectionName] = {
                totalWords: sectionWords.length,
                matchedKeywords: sectionMatches,
                matchCount: sectionMatches.length,
                matchPercentage: jobKeywords.length > 0 ? 
                    Math.round((sectionMatches.length / jobKeywords.length) * 100) : 0
            };
        });

        return sectionAnalysis;
    }

    isStopWord(word) {
        const stopWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
            'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
        ];
        return stopWords.includes(word.toLowerCase());
    }

    isTechnicalTerm(word) {
        return this.technicalSkills.some(skill => 
            word.toLowerCase().includes(skill) || skill.includes(word.toLowerCase())
        );
    }

    isImportantTerm(word) {
        return this.experienceTerms.includes(word.toLowerCase()) || 
               this.softSkills.includes(word.toLowerCase()) ||
               word.length > 4; // Longer words are generally more meaningful
    }
}