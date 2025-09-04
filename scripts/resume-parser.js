export class ResumeParser {
    constructor() {
        this.sectionPatterns = {
            experience: /(?:experience|work\s+history|employment|professional\s+experience|career\s+history)/i,
            education: /(?:education|academic|qualification|degree|university|college)/i,
            skills: /(?:skills|technical\s+skills|competencies|technologies|expertise)/i,
            projects: /(?:projects|portfolio|work\s+samples|achievements)/i,
            summary: /(?:summary|objective|profile|about|overview|professional\s+summary)/i,
            contact: /(?:contact|personal|phone|email|address|linkedin)/i
        };
    }

    async parseFile(file) {
        try {
            if (file.type === 'text/plain') {
                return await this.parseTextFile(file);
            } else if (file.type === 'application/pdf') {
                return await this.parsePDFFile(file);
            } else {
                // For DOC/DOCX, we'll use a simplified approach
                return await this.parseDocFile(file);
            }
        } catch (error) {
            console.error('Error parsing file:', error);
            throw new Error(`Failed to parse ${file.name}`);
        }
    }

    async parseTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    async parsePDFFile(file) {
        // For demo purposes, we'll simulate PDF parsing
        // In production, you'd use PDF.js or similar library
        const text = await this.parseTextFile(file);
        return text || `Resume content from ${file.name}\n\nNote: PDF parsing requires additional libraries for full functionality.`;
    }

    async parseDocFile(file) {
        // For demo purposes, we'll use a simplified approach
        // In production, you'd use mammoth.js or similar library for DOC/DOCX
        return `Resume content from ${file.name}\n\nNote: DOC/DOCX parsing requires additional libraries for full functionality.`;
    }

    extractSections(resumeText) {
        const sections = {
            experience: '',
            education: '',
            skills: '',
            projects: '',
            summary: '',
            contact: '',
            fullText: resumeText
        };

        const lines = resumeText.split('\n').map(line => line.trim());
        let currentSection = '';
        let currentContent = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;

            // Check if line is a section header
            const sectionFound = this.identifySection(line);
            
            if (sectionFound) {
                // Save previous section content
                if (currentSection && currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                
                currentSection = sectionFound;
                currentContent = [];
            } else if (currentSection) {
                currentContent.push(line);
            } else {
                // If no section identified yet, might be summary/objective at top
                if (i < 10 && line.length > 20) {
                    if (!sections.summary) {
                        sections.summary = line;
                    }
                }
            }
        }

        // Save the last section
        if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
        }

        // If no structured sections found, try to extract key information from full text
        if (!sections.experience && !sections.skills) {
            this.extractUnstructuredSections(sections, resumeText);
        }

        return sections;
    }

    identifySection(line) {
        const cleanLine = line.toLowerCase().replace(/[^\w\s]/g, '');
        
        for (const [sectionName, pattern] of Object.entries(this.sectionPatterns)) {
            if (pattern.test(cleanLine)) {
                return sectionName;
            }
        }
        return null;
    }

    extractUnstructuredSections(sections, text) {
        const words = text.toLowerCase().split(/\s+/);
        
        // Look for common skill keywords
        const skillKeywords = [
            'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'typescript',
            'aws', 'azure', 'docker', 'kubernetes', 'sql', 'mongodb', 'postgresql', 'mysql',
            'html', 'css', 'sass', 'less', 'webpack', 'git', 'github', 'gitlab',
            'agile', 'scrum', 'devops', 'ci/cd', 'jenkins', 'terraform', 'ansible',
            'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch'
        ];
        
        const foundSkills = skillKeywords.filter(skill => 
            words.some(word => word.includes(skill))
        );
        
        if (foundSkills.length > 0) {
            sections.skills = foundSkills.join(', ');
        }

        // Look for experience indicators
        const experienceKeywords = ['years', 'experience', 'worked', 'developed', 'managed', 'led'];
        const hasExperience = experienceKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
        
        if (hasExperience) {
            sections.experience = 'Experience details found in resume content';
        }

        // Extract education information
        const educationKeywords = ['degree', 'bachelor', 'master', 'phd', 'university', 'college', 'education'];
        const hasEducation = educationKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
        
        if (hasEducation && !sections.education) {
            sections.education = 'Educational background found in resume';
        }

        // Extract project information
        const projectKeywords = ['project', 'built', 'developed', 'created', 'portfolio', 'github'];
        const hasProjects = projectKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
        
        if (hasProjects && !sections.projects) {
            sections.projects = 'Project experience found in resume';
        }
    }
}