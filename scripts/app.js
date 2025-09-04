import { ResumeParser } from './resume-parser.js';
import { AIMatcher } from './ai-matcher.js';
import { ScoringEngine } from './scoring.js';
import { WordMatcher } from './word-matcher.js';
import { Dashboard } from './dashboard.js';
import { PaymentProcessor } from './payment.js';

class ATSTracker {
    constructor() {
        this.resumeParser = new ResumeParser();
        this.aiMatcher = new AIMatcher();
        this.scoringEngine = new ScoringEngine();
        this.wordMatcher = new WordMatcher();
        this.dashboard = new Dashboard();
        this.paymentProcessor = new PaymentProcessor();
        
        this.jobData = null;
        this.singleJobData = null;
        this.uploadedResumes = [];
        this.singleResume = null;
        this.analysisResults = [];
        this.credits = 50;
        
        this.initEventListeners();
        this.initNavigation();
        this.updateCreditsDisplay();
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    showSection(sectionName) {
        const sections = document.querySelectorAll('.page-section');
        sections.forEach(section => section.classList.remove('active'));
        
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    initEventListeners() {
        // Bulk analysis events
        document.getElementById('saveJob').addEventListener('click', () => this.saveJobDescription());
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('analyzeResumes').addEventListener('click', () => this.analyzeResumes());

        // Single analysis events
        const singleUploadArea = document.getElementById('singleUploadArea');
        const singleFileInput = document.getElementById('singleFileInput');
        
        singleUploadArea.addEventListener('click', () => singleFileInput.click());
        singleUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        singleUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        singleUploadArea.addEventListener('drop', (e) => this.handleSingleFileDrop(e));
        
        singleFileInput.addEventListener('change', (e) => this.handleSingleFileSelect(e));
        document.getElementById('analyzeSingleResume').addEventListener('click', () => this.analyzeSingleResume());

        // Tab switching for word matching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target);
            }
        });

        // Pricing events
        document.querySelectorAll('.btn-plan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.dataset.plan;
                this.handlePlanSelection(plan);
            });
        });

        // Payment modal events
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            this.hidePaymentModal();
        });

        document.getElementById('processPayment').addEventListener('click', () => {
            this.processPayment();
        });

        // Upgrade button event
        const upgradeButton = document.getElementById('upgradeButton');
        if (upgradeButton) {
            upgradeButton.addEventListener('click', () => {
                this.showSection('pricing');
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                document.querySelector('.nav-link[data-section="pricing"]').classList.add('active');
            });
        }

        // Input formatting
        this.setupPaymentInputFormatting();
    }

    saveJobDescription() {
        const jobTitle = document.getElementById('jobTitle').value.trim();
        const jobDescription = document.getElementById('jobDescription').value.trim();
        const requiredSkills = document.getElementById('requiredSkills').value.trim();

        if (!jobTitle || !jobDescription || !requiredSkills) {
            this.showNotification('Please fill in all job description fields', 'error');
            return;
        }

        this.jobData = {
            title: jobTitle,
            description: jobDescription,
            skills: requiredSkills.split(',').map(skill => skill.trim())
        };

        this.showNotification('Job description saved successfully!', 'success');
        this.updateAnalyzeButton();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    handleSingleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            this.processSingleFile(files[0]);
        }
    }

    handleSingleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processSingleFile(file);
        }
    }

    processFiles(files) {
        const validFiles = files.filter(file => {
            const validTypes = ['application/pdf', 'application/msword', 
                              'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                              'text/plain'];
            return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
        });

        if (validFiles.length === 0) {
            this.showNotification('Please upload valid resume files (PDF, DOC, DOCX, TXT) under 10MB', 'error');
            return;
        }

        validFiles.forEach(file => {
            if (!this.uploadedResumes.find(resume => resume.file.name === file.name)) {
                this.uploadedResumes.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    status: 'uploaded'
                });
            }
        });

        this.displayUploadedFiles();
        this.updateAnalyzeButton();
    }

    processSingleFile(file) {
        const validTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                          'text/plain'];
        
        if (!validTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
            this.showNotification('Please upload a valid resume file (PDF, DOC, DOCX, TXT) under 10MB', 'error');
            return;
        }

        this.singleResume = file;
        this.displaySingleFile();
        this.updateSingleAnalyzeButton();
    }

    displaySingleFile() {
        const container = document.getElementById('singleFileDisplay');
        if (this.singleResume) {
            container.innerHTML = `
                <div class="file-card">
                    <svg class="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    <div class="file-info">
                        <div class="file-name">${this.singleResume.name}</div>
                        <div class="file-size">${this.formatFileSize(this.singleResume.size)}</div>
                    </div>
                    <button class="file-remove" onclick="atsTracker.removeSingleFile()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6 6 18M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = '';
        }
    }

    removeSingleFile() {
        this.singleResume = null;
        this.displaySingleFile();
        this.updateSingleAnalyzeButton();
        document.getElementById('singleResults').style.display = 'none';
    }

    displayUploadedFiles() {
        const container = document.getElementById('uploadedFiles');
        container.innerHTML = '';

        this.uploadedResumes.forEach(resume => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            fileCard.innerHTML = `
                <svg class="file-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                <div class="file-info">
                    <div class="file-name">${resume.file.name}</div>
                    <div class="file-size">${this.formatFileSize(resume.file.size)}</div>
                </div>
                <button class="file-remove" onclick="atsTracker.removeFile('${resume.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6 6 18M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            container.appendChild(fileCard);
        });
    }

    removeFile(fileId) {
        this.uploadedResumes = this.uploadedResumes.filter(resume => resume.id !== fileId);
        this.displayUploadedFiles();
        this.updateAnalyzeButton();
    }

    updateAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeResumes');
        const canAnalyze = this.jobData && this.uploadedResumes.length > 0 && this.credits > 0;
        analyzeBtn.disabled = !canAnalyze;
    }

    updateSingleAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeSingleResume');
        const jobTitle = document.getElementById('singleJobTitle').value.trim();
        const jobDescription = document.getElementById('singleJobDescription').value.trim();
        const requiredSkills = document.getElementById('singleRequiredSkills').value.trim();
        
        const canAnalyze = jobTitle && jobDescription && requiredSkills && this.singleResume && this.credits > 0;
        analyzeBtn.disabled = !canAnalyze;
    }

    async analyzeSingleResume() {
        const jobTitle = document.getElementById('singleJobTitle').value.trim();
        const jobDescription = document.getElementById('singleJobDescription').value.trim();
        const requiredSkills = document.getElementById('singleRequiredSkills').value.trim();


        this.singleJobData = {
            title: jobTitle,
            description: jobDescription,
            skills: requiredSkills.split(',').map(skill => skill.trim())
        };

        this.showLoadingOverlay(true, 'Analyzing single resume...');

        try {
            // Parse resume content
            const resumeContent = await this.resumeParser.parseFile(this.singleResume);
            const extractedSections = this.resumeParser.extractSections(resumeContent);
            
            // Get AI analysis
            const aiAnalysis = await this.aiMatcher.analyzeMatch(this.singleJobData, extractedSections);
            
            // Calculate scores
            const detailedScores = this.scoringEngine.calculateScores(
                this.singleJobData, 
                extractedSections, 
                aiAnalysis
            );

            // Perform detailed word matching
            const wordAnalysis = this.wordMatcher.analyzeWordMatching(
                this.singleJobData,
                extractedSections
            );

            const result = {
                fileName: this.singleResume.name,
                sections: extractedSections,
                aiAnalysis: aiAnalysis,
                scores: detailedScores,
                wordAnalysis: wordAnalysis,
                timestamp: new Date()
            };

            this.credits--;
            this.updateCreditsDisplay();
            this.dashboard.addActivity('single', result);

            this.showLoadingOverlay(false);
            this.displaySingleResult(result);

        } catch (error) {
            console.error('Single analysis error:', error);
            this.showLoadingOverlay(false);
            this.showNotification('Error analyzing resume. Please try again.', 'error');
        }
    }

    async analyzeResumes() {
        if (!this.jobData || this.uploadedResumes.length === 0) {
            this.showNotification('Please save job description and upload resumes first', 'error');
            return;
        }

        if (this.credits < this.uploadedResumes.length) {
            this.showNotification(`Insufficient credits. You need ${this.uploadedResumes.length} credits but have ${this.credits}.`, 'error');
            return;
        }

        this.showLoadingOverlay(true, 'Analyzing resumes...');
        this.analysisResults = [];

        try {
            for (let i = 0; i < this.uploadedResumes.length; i++) {
                const resume = this.uploadedResumes[i];
                this.updateProgress((i / this.uploadedResumes.length) * 100);
                
                const resumeContent = await this.resumeParser.parseFile(resume.file);
                const extractedSections = this.resumeParser.extractSections(resumeContent);
                const aiAnalysis = await this.aiMatcher.analyzeMatch(this.jobData, extractedSections);
                const detailedScores = this.scoringEngine.calculateScores(
                    this.jobData, 
                    extractedSections, 
                    aiAnalysis
                );
                const wordAnalysis = this.wordMatcher.analyzeWordMatching(
                    this.jobData,
                    extractedSections
                );

                this.analysisResults.push({
                    id: resume.id,
                    fileName: resume.file.name,
                    sections: extractedSections,
                    aiAnalysis: aiAnalysis,
                    scores: detailedScores,
                    wordAnalysis: wordAnalysis,
                    status: 'pending',
                    timestamp: new Date()
                });

                this.credits--;
            }

            this.analysisResults.sort((a, b) => b.scores.overall - a.scores.overall);
            
            this.updateProgress(100);
            this.updateCreditsDisplay();
            this.dashboard.addActivity('bulk', { 
                count: this.analysisResults.length, 
                jobTitle: this.jobData.title,
                results: this.analysisResults 
            });

            setTimeout(() => {
                this.showLoadingOverlay(false);
                this.displayResults();
            }, 500);

        } catch (error) {
            console.error('Analysis error:', error);
            this.showLoadingOverlay(false);
            this.showNotification('Error analyzing resumes. Please try again.', 'error');
        }
    }

    displaySingleResult(result) {
        const resultsSection = document.getElementById('singleResults');
        const overallScoreEl = document.getElementById('singleOverallScore');
        const detailedAnalysisEl = document.getElementById('detailedAnalysis');
        
        resultsSection.style.display = 'block';
        
        // Display overall score
        const scoreClass = this.getScoreClass(result.scores.overall);
        overallScoreEl.className = `overall-score-large ${scoreClass}`;
        overallScoreEl.textContent = `${result.scores.overall}%`;

        // Display detailed analysis
        detailedAnalysisEl.innerHTML = `
            <div class="analysis-card">
                <h4>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 4v6"></path>
                    </svg>
                    Experience Analysis
                </h4>
                <div class="analysis-score" style="color: ${this.getScoreColor(result.scores.experience)}">
                    ${result.scores.experience}%
                </div>
                <div class="analysis-text">${result.aiAnalysis.experienceAnalysis}</div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${result.scores.experience}%; background: #16a34a;"></div>
                </div>
            </div>
            
            <div class="analysis-card">
                <h4>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Skills Match
                </h4>
                <div class="analysis-score" style="color: ${this.getScoreColor(result.scores.skills)}">
                    ${result.scores.skills}%
                </div>
                <div class="analysis-text">${result.aiAnalysis.skillsAnalysis}</div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${result.scores.skills}%; background: #2563eb;"></div>
                </div>
            </div>
            
            <div class="analysis-card">
                <h4>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    Projects Relevance
                </h4>
                <div class="analysis-score" style="color: ${this.getScoreColor(result.scores.projects)}">
                    ${result.scores.projects}%
                </div>
                <div class="analysis-text">${result.aiAnalysis.projectsAnalysis}</div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${result.scores.projects}%; background: #7c3aed;"></div>
                </div>
            </div>
            
            <div class="analysis-card">
                <h4>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                    Summary Alignment
                </h4>
                <div class="analysis-score" style="color: ${this.getScoreColor(result.scores.summary)}">
                    ${result.scores.summary}%
                </div>
                <div class="analysis-text">${result.aiAnalysis.summaryAnalysis}</div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${result.scores.summary}%; background: #db2777;"></div>
                </div>
            </div>
        `;

        // Initialize word matching tabs
        this.currentWordAnalysis = result.wordAnalysis;
        this.switchTab(document.querySelector('.tab-btn[data-tab="matched"]'));

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        const resultsContainer = document.getElementById('resultsContainer');
        
        resultsSection.style.display = 'block';
        resultsContainer.innerHTML = '';

        this.analysisResults.forEach((result, index) => {
            const candidateCard = this.createCandidateCard(result, index + 1);
            resultsContainer.appendChild(candidateCard);
        });

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    createCandidateCard(result, rank) {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        
        const scoreClass = this.getScoreClass(result.scores.overall);
        const statusClass = result.status === 'shortlisted' ? 'status-shortlisted' : 
                          result.status === 'rejected' ? 'status-rejected' : 'status-pending';

        card.innerHTML = `
            <div class="candidate-header">
                <div class="candidate-info">
                    <h3>#${rank} ${result.fileName.replace(/\.[^/.]+$/, "")}</h3>
                    <p>Overall Match Score: ${result.scores.overall}% | ${result.wordAnalysis.summary.totalMatched}/${result.wordAnalysis.summary.totalKeywords} keywords matched</p>
                </div>
                <div class="overall-score">
                    <div class="score-circle ${scoreClass}">
                        ${result.scores.overall}%
                    </div>
                </div>
            </div>
            
            <div class="score-details">
                <div class="score-item">
                    <h4>Experience Match</h4>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.scores.experience}%; background: #16a34a;"></div>
                    </div>
                    <p class="score-text">${result.aiAnalysis.experienceAnalysis}</p>
                </div>
                
                <div class="score-item">
                    <h4>Skills Match</h4>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.scores.skills}%; background: #2563eb;"></div>
                    </div>
                    <p class="score-text">${result.aiAnalysis.skillsAnalysis}</p>
                </div>
                
                <div class="score-item">
                    <h4>Projects Relevance</h4>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.scores.projects}%; background: #7c3aed;"></div>
                    </div>
                    <p class="score-text">${result.aiAnalysis.projectsAnalysis}</p>
                </div>
                
                <div class="score-item">
                    <h4>Summary Alignment</h4>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${result.scores.summary}%; background: #db2777;"></div>
                    </div>
                    <p class="score-text">${result.aiAnalysis.summaryAnalysis}</p>
                </div>
            </div>
            
            <div class="candidate-actions">
                <button class="btn-shortlist" onclick="atsTracker.updateCandidateStatus('${result.id}', 'shortlisted')">
                    Shortlist
                </button>
                <button class="btn-reject" onclick="atsTracker.updateCandidateStatus('${result.id}', 'rejected')">
                    Reject
                </button>
                <button class="btn-details" onclick="atsTracker.toggleDetails('${result.id}')">
                    View Details
                </button>
                <span class="status-indicator ${statusClass}">${result.status.charAt(0).toUpperCase() + result.status.slice(1)}</span>
            </div>
            
            <div class="expandable-details" id="details-${result.id}">
                ${this.createDetailedWordAnalysis(result.wordAnalysis)}
            </div>
        `;

        return card;
    }

    createDetailedWordAnalysis(wordAnalysis) {
        return `
            <div class="detailed-word-analysis">
                <h4>Detailed Keyword Analysis</h4>
                <div class="word-match-grid">
                    <div class="match-category">
                        <h5>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Matched Keywords (${wordAnalysis.matched.length})
                        </h5>
                        <div class="match-stats">
                            <span>Found in resume</span>
                            <span>${Math.round((wordAnalysis.matched.length / wordAnalysis.summary.totalKeywords) * 100)}% match rate</span>
                        </div>
                        <div class="word-tags">
                            ${wordAnalysis.matched.map(word => `<span class="word-tag matched">${word}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="match-category">
                        <h5>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            Missing Keywords (${wordAnalysis.missing.length})
                        </h5>
                        <div class="match-stats">
                            <span>Not found in resume</span>
                            <span>Consider adding these</span>
                        </div>
                        <div class="word-tags">
                            ${wordAnalysis.missing.map(word => `<span class="word-tag missing">${word}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="match-category">
                        <h5>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                            Partial Matches (${wordAnalysis.partial.length})
                        </h5>
                        <div class="match-stats">
                            <span>Similar terms found</span>
                            <span>Close but not exact</span>
                        </div>
                        <div class="word-tags">
                            ${wordAnalysis.partial.map(word => `<span class="word-tag partial">${word}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleDetails(candidateId) {
        const detailsEl = document.getElementById(`details-${candidateId}`);
        detailsEl.classList.toggle('expanded');
    }

    switchTab(tabBtn) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        const tabType = tabBtn.dataset.tab;
        const content = document.getElementById('wordMatchingContent');

        if (!this.currentWordAnalysis) return;

        switch (tabType) {
            case 'matched':
                content.innerHTML = this.createMatchedKeywordsView(this.currentWordAnalysis.matched);
                break;
            case 'missing':
                content.innerHTML = this.createMissingKeywordsView(this.currentWordAnalysis.missing);
                break;
            case 'suggestions':
                content.innerHTML = this.createSuggestionsView(this.currentWordAnalysis);
                break;
        }
    }

    createMatchedKeywordsView(matchedWords) {
        if (matchedWords.length === 0) {
            return '<div class="empty-state"><p>No keywords matched</p></div>';
        }

        return `
            <div class="keyword-grid">
                <div class="keyword-category">
                    <h5>Technical Skills</h5>
                    <div class="keyword-list">
                        ${matchedWords.filter(word => this.isTechnicalSkill(word))
                            .map(word => `<span class="keyword-tag keyword-matched">${word}</span>`).join('')}
                    </div>
                </div>
                <div class="keyword-category">
                    <h5>Experience Terms</h5>
                    <div class="keyword-list">
                        ${matchedWords.filter(word => this.isExperienceTerm(word))
                            .map(word => `<span class="keyword-tag keyword-matched">${word}</span>`).join('')}
                    </div>
                </div>
                <div class="keyword-category">
                    <h5>Other Keywords</h5>
                    <div class="keyword-list">
                        ${matchedWords.filter(word => !this.isTechnicalSkill(word) && !this.isExperienceTerm(word))
                            .map(word => `<span class="keyword-tag keyword-matched">${word}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    createMissingKeywordsView(missingWords) {
        if (missingWords.length === 0) {
            return '<div class="empty-state"><p>All important keywords found!</p></div>';
        }

        return `
            <div class="keyword-grid">
                <div class="keyword-category">
                    <h5>Critical Missing Skills</h5>
                    <div class="keyword-list">
                        ${missingWords.filter(word => this.isTechnicalSkill(word))
                            .map(word => `<span class="keyword-tag keyword-missing">${word}</span>`).join('')}
                    </div>
                </div>
                <div class="keyword-category">
                    <h5>Missing Experience Terms</h5>
                    <div class="keyword-list">
                        ${missingWords.filter(word => this.isExperienceTerm(word))
                            .map(word => `<span class="keyword-tag keyword-missing">${word}</span>`).join('')}
                    </div>
                </div>
                <div class="keyword-category">
                    <h5>Other Missing Terms</h5>
                    <div class="keyword-list">
                        ${missingWords.filter(word => !this.isTechnicalSkill(word) && !this.isExperienceTerm(word))
                            .map(word => `<span class="keyword-tag keyword-missing">${word}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    createSuggestionsView(wordAnalysis) {
        return `
            <div class="keyword-grid">
                <div class="keyword-category">
                    <h5>Improvement Suggestions</h5>
                    <div class="analysis-text">
                        <p><strong>Match Rate:</strong> ${Math.round((wordAnalysis.summary.totalMatched / wordAnalysis.summary.totalKeywords) * 100)}%</p>
                        <p><strong>Recommendations:</strong></p>
                        <ul style="margin-left: 20px; margin-top: 8px;">
                            ${wordAnalysis.missing.length > 0 ? 
                                `<li>Add missing keywords: ${wordAnalysis.missing.slice(0, 5).join(', ')}</li>` : ''}
                            ${wordAnalysis.partial.length > 0 ? 
                                `<li>Strengthen partial matches: ${wordAnalysis.partial.slice(0, 3).join(', ')}</li>` : ''}
                            <li>Focus on technical skills section to improve visibility</li>
                            <li>Include specific project examples that demonstrate required skills</li>
                        </ul>
                    </div>
                </div>
                <div class="keyword-category">
                    <h5>Suggested Keywords</h5>
                    <div class="keyword-list">
                        ${wordAnalysis.suggestions.map(word => `<span class="keyword-tag keyword-suggested">${word}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    isTechnicalSkill(word) {
        const techSkills = ['javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'aws', 'docker', 'kubernetes', 'sql', 'html', 'css', 'typescript', 'mongodb', 'postgresql'];
        return techSkills.some(skill => word.toLowerCase().includes(skill));
    }

    isExperienceTerm(word) {
        const expTerms = ['years', 'experience', 'senior', 'lead', 'manager', 'director', 'architect', 'principal'];
        return expTerms.some(term => word.toLowerCase().includes(term));
    }

    updateCandidateStatus(candidateId, status) {
        const candidate = this.analysisResults.find(result => result.id === candidateId);
        if (candidate) {
            candidate.status = status;
            this.displayResults();
            this.dashboard.updateStats();
        }
    }

    getScoreClass(score) {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-average';
        return 'score-poor';
    }

    getScoreColor(score) {
        if (score >= 80) return '#16a34a';
        if (score >= 60) return '#eab308';
        if (score >= 40) return '#f97316';
        return '#ef4444';
    }

    handlePlanSelection(plan) {
        if (plan === 'enterprise') {
            window.open('mailto:sales@atstracker.com?subject=Enterprise Plan Inquiry', '_blank');
            return;
        }

        const planDetails = {
            starter: { name: 'Starter', price: 37, credits: 100 },
            professional: { name: 'Professional', price: 102, credits: 500 }
        };

        this.showPaymentModal(planDetails[plan]);
    }

    showPaymentModal(planDetails) {
        const modal = document.getElementById('paymentModal');
        const summary = document.getElementById('paymentSummary');

        summary.innerHTML = `
            <h4>${planDetails.name} Plan</h4>
            <div style="display: flex; justify-content: space-between; margin: 12px 0;">
                <span>Monthly subscription</span>
                <span>$${planDetails.price}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 12px 0;">
                <span>Credits included</span>
                <span>${planDetails.credits}</span>
            </div>
            <hr style="margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
                <span>Total</span>
                <span>$${planDetails.price}/month</span>
            </div>
        `;

        modal.style.display = 'flex';
        this.currentPlan = planDetails;

        // Show QR payment option
        this.paymentProcessor.showQRPayment(planDetails);
    }

    hidePaymentModal() {
        document.getElementById('paymentModal').style.display = 'none';
        this.currentPlan = null;
        // Hide QR payment section
        this.paymentProcessor.hideQRPayment();
    }

    async processPayment() {
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardholderName = document.getElementById('cardholderName').value;

        if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
            this.showNotification('Please fill in all payment details', 'error');
            return;
        }

        try {
            const success = await this.paymentProcessor.processPayment({
                plan: this.currentPlan,
                cardNumber,
                expiryDate,
                cvv,
                cardholderName
            });

            if (success) {
                this.credits += this.currentPlan.credits;
                this.updateCreditsDisplay();
                this.hidePaymentModal();
                this.showNotification(`Successfully upgraded to ${this.currentPlan.name} plan!`, 'success');
            } else {
                this.showNotification('Payment failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Payment error:', error);
            this.showNotification('Payment processing error. Please try again.', 'error');
        }
    }

    setupPaymentInputFormatting() {
        // Card number formatting
        document.getElementById('cardNumber').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });

        // Expiry date formatting
        document.getElementById('expiryDate').addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });

        // CVV formatting
        document.getElementById('cvv').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    updateCreditsDisplay() {
        document.getElementById('creditsCount').textContent = this.credits;
    }

    showLoadingOverlay(show, text = 'AI is processing and matching candidates against job requirements...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        overlay.style.display = show ? 'flex' : 'none';
        loadingText.textContent = text;
        
        if (!show) {
            this.updateProgress(0);
        }
    }

    updateProgress(percentage) {
        document.getElementById('progressFill').style.width = `${percentage}%`;
    }

    showNotification(message, type = 'info') {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#16a34a' : type === 'error' ? '#ef4444' : '#2563eb'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgb(0 0 0 / 0.3);
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all data?')) {
            this.jobData = null;
            this.uploadedResumes = [];
            this.analysisResults = [];
            
            document.getElementById('jobTitle').value = '';
            document.getElementById('jobDescription').value = '';
            document.getElementById('requiredSkills').value = '';
            document.getElementById('uploadedFiles').innerHTML = '';
            document.getElementById('resultsSection').style.display = 'none';
            
            this.updateAnalyzeButton();
        }
    }

    exportResults() {
        const shortlistedCandidates = this.analysisResults.filter(result => result.status === 'shortlisted');
        
        if (shortlistedCandidates.length === 0) {
            this.showNotification('No candidates have been shortlisted yet', 'warning');
            return;
        }

        const exportData = {
            jobTitle: this.jobData.title,
            analysisDate: new Date().toISOString(),
            totalCandidates: this.analysisResults.length,
            shortlistedCandidates: shortlistedCandidates.map(candidate => ({
                fileName: candidate.fileName,
                overallScore: candidate.scores.overall,
                experienceScore: candidate.scores.experience,
                skillsScore: candidate.scores.skills,
                projectsScore: candidate.scores.projects,
                summaryScore: candidate.scores.summary,
                keywordsMatched: candidate.wordAnalysis.summary.totalMatched,
                totalKeywords: candidate.wordAnalysis.summary.totalKeywords,
                matchRate: Math.round((candidate.wordAnalysis.summary.totalMatched / candidate.wordAnalysis.summary.totalKeywords) * 100),
                aiRecommendation: candidate.aiAnalysis.recommendation
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ats-results-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Results exported successfully!', 'success');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application
window.atsTracker = new ATSTracker();