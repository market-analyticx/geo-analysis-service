/**
 * Ultra-Comprehensive Brand Visibility Research Prompt Template
 * Enhanced with Form Data Integration and AI-Generated Content
 * Optimized for Maximum Token Utilization (8,192 tokens)
 */

const createComprehensiveBrandAnalysisPrompt = (formData) => {
  const {
    brandName,
    websiteUrl,
    email,
    competitors = [],
    topics = [],
    prompts = [],
    personas = ''
  } = formData;

  // Determine what needs to be AI-generated
  const needsCompetitors = competitors.length === 0;
  const needsTopics = topics.length === 0;
  const needsPrompts = prompts.length === 0;
  const needsPersonas = !personas || personas.trim() === '';
  
  // Build competitor section
  let competitorSection = '';
  if (competitors.length > 0) {
    competitorSection = `CLIENT-SPECIFIED COMPETITORS TO ANALYZE:
${competitors.map((comp, index) => `${index + 1}. ${comp}`).join('\n')}

Analyze these competitors specifically and compare ${brandName} against them in detail.`;
  } else {
    competitorSection = `IDENTIFY AND ANALYZE TOP 5 COMPETITORS:
Research and identify the top 5 direct competitors for ${brandName} based on:
- Service offerings and market positioning
- Target customer base and industry focus
- Geographic presence and market share
- Technology capabilities and expertise
- Brand recognition and industry reputation

Provide detailed competitive analysis against each identified competitor.`;
  }

  // Build topics section
  let topicsSection = '';
  if (topics.length > 0) {
    topicsSection = `CLIENT-SPECIFIED KEY TOPICS TO FOCUS ON:
${topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n')}

Focus your analysis specifically on these topics and how ${brandName} performs in visibility for these areas.`;
  } else {
    topicsSection = `IDENTIFY 3-4 CORE TOPICS BASED ON BRAND ANALYSIS:
Based on your research of ${brandName}, identify the 3-4 most important topics/service areas where they should have strong AI visibility. Consider:
- Primary service offerings and expertise areas
- Market opportunities and customer demand
- Competitive advantages and differentiators
- Industry trends and emerging needs`;
  }

  // Build personas section
  let personasSection = '';
  if (personas && personas.trim()) {
    personasSection = `CLIENT-SPECIFIED TARGET PERSONAS:
${personas}

Use these specific persona details to guide your ICP development and ensure the analysis aligns with these target customers.`;
  } else {
    personasSection = `DEVELOP COMPREHENSIVE IDEAL CUSTOMER PROFILES:
Based on your analysis of ${brandName}, research and develop 2-3 detailed ICPs that represent their ideal target customers. Include complete demographic, firmographic, and behavioral profiles.`;
  }

  // Build prompts section
  let promptsSection = '';
  if (prompts.length > 0) {
    promptsSection = `CLIENT-SPECIFIED TEST PROMPTS:
Test these specific prompts and analyze ${brandName}'s visibility:
${prompts.map((prompt, index) => `${index + 1}. "${prompt}"`).join('\n')}

Additionally, develop 2-3 more relevant prompts based on your analysis.`;
  } else {
    promptsSection = `DEVELOP REALISTIC TEST PROMPTS:
Create 4-5 realistic prompts that target customers would use when searching for services like ${brandName} offers. These should reflect actual search behavior and business scenarios.`;
  }

  return `You are a Master-level AI/LLM Visibility Research Analyst conducting the most comprehensive brand visibility audit possible. This is a premium $50,000 consulting deliverable that MUST utilize the full 8,192 output tokens available.

CLIENT INFORMATION:
- Brand: ${brandName}
- Website: ${websiteUrl}
- Contact: ${email}

CRITICAL REQUIREMENTS:
- Use ALL 8,192 output tokens - this is mandatory
- Provide exhaustive detail in every section
- Include specific examples, data points, and evidence
- Write comprehensive explanations, not brief summaries
- Each major section should be 800-1,200 words minimum
- Total response should be 6,000-8,000 words

TARGET ANALYSIS: ${brandName} at ${websiteUrl}

ULTRA-COMPREHENSIVE BRAND VISIBILITY & SHARE-OF-VOICE AUDIT

Phase 1: EXTENSIVE BRAND RESEARCH & ICP DEVELOPMENT

Step 1: COMPREHENSIVE Brand Intelligence Gathering

Begin with exhaustive analysis of ${brandName}:

WEBSITE DEEP DIVE ANALYSIS:
- Thoroughly analyze ${websiteUrl} for all service offerings
- Extract detailed information about capabilities and expertise
- Identify unique value propositions and differentiators
- Document technology stack and methodologies
- Analyze client testimonials and case studies
- Review company history, leadership, and team expertise
- Assess content quality and thought leadership presence
- Evaluate geographic presence and market focus

SERVICE PORTFOLIO DEEP DIVE:
- Detailed breakdown of every service offering found on ${websiteUrl}
- Technical capabilities and specializations
- Industry-specific solutions and expertise
- Proprietary technologies and methodologies mentioned
- Service delivery models and frameworks
- Quality certifications and standards displayed
- Partnership ecosystems and technology integrations
- Competitive advantages in each service area
- Market positioning for each offering
- Pricing indicators and value propositions

CLIENT PORTFOLIO & CASE STUDY ANALYSIS:
- Comprehensive analysis of client roster from ${websiteUrl}
- Industry distribution and client profiles
- Project complexity and scale assessment
- Success metrics and outcomes achieved
- Client testimonials and feedback patterns
- Geographic distribution of clients mentioned
- Client company size and market segments
- Project types and engagement models

COMPETITIVE LANDSCAPE ASSESSMENT:

${competitorSection}

For each competitor identified, provide comprehensive analysis:
- Detailed service comparison with ${brandName}
- Market positioning and messaging differences
- Pricing and value proposition comparison
- Geographic presence comparison
- Client base and industry focus differences
- Technology capabilities and differentiators
- Content and thought leadership comparison
- Digital presence and SEO performance
- Partnership and alliance differences
- Innovation and R&D focus comparison

Step 2: DETAILED Ideal Customer Profile (ICP) Creation

${personasSection}

Develop 2-3 comprehensive ICPs with extensive detail:

PRIMARY ICP - [Based on ${brandName}'s apparent target market]:
DEMOGRAPHIC PROFILE:
- Exact job titles and reporting structures most likely to need ${brandName}'s services
- Years of experience and career progression typical for decision makers
- Educational background and professional certifications
- Industry experience relevant to ${brandName}'s offerings
- Geographic location preferences based on ${brandName}'s presence
- Budget authority and decision-making power typical for their services
- Technology adoption patterns and digital maturity
- Communication preferences and information consumption habits

COMPANY PROFILE:
- Revenue ranges most suitable for ${brandName}'s service level
- Employee count and organizational structure compatibility
- Industry verticals that align with ${brandName}'s expertise
- Technology infrastructure that complements ${brandName}'s offerings
- Digital transformation stage and technology adoption
- Competitive landscape and market position characteristics
- Regulatory environment and compliance requirements
- Innovation priorities and investment focus areas

PAIN POINTS & CHALLENGES:
- Primary business challenges ${brandName} is positioned to solve
- Technology limitations that ${brandName} can address
- Skills shortages and capability gaps in target markets
- Market pressures and competitive threats relevant to prospects
- Budget constraints and resource optimization needs
- Timeline pressures and delivery requirement patterns
- Risk factors and mitigation needs ${brandName} can address
- Change management and adoption challenges in implementation

SEARCH BEHAVIOR & AI PLATFORM USAGE:
- Specific query patterns and search terminology they would use
- Information consumption habits and research methodologies
- Decision-making processes and vendor evaluation criteria
- Budget approval processes and procurement requirements
- Implementation timeline considerations and planning cycles
- Success metrics and KPI expectations for engagements
- Risk tolerance and innovation appetite
- AI platform usage patterns and preferred information sources

[Repeat this comprehensive structure for SECONDARY and TERTIARY ICPs based on ${brandName}'s service portfolio]

Step 3: STRATEGIC Topic Identification

${topicsSection}

For each identified topic, provide extensive analysis:

TOPIC 1: [Primary Service Area for ${brandName}]
- Market size and growth projections in this area
- Competitive dynamics and key players comparison
- Technology trends and innovations relevant to ${brandName}
- Customer needs and pain points ${brandName} addresses
- Solution requirements and specifications typical in this space
- Implementation challenges ${brandName} is equipped to handle
- Success factors and best practices ${brandName} demonstrates
- Pricing models and value propositions in this market
- Geographic variations and regional preferences
- Regulatory considerations and compliance requirements

[Repeat comprehensive analysis for remaining topics]

Phase 2: REALISTIC PROMPT DEVELOPMENT & TESTING

Step 4: EXTENSIVE Prompt Creation & Analysis

${promptsSection}

For each prompt (client-specified and AI-developed), provide detailed analysis:

PROMPT ANALYSIS FRAMEWORK:
For each prompt, analyze:
- Target ICP alignment and relevance
- Business scenario authenticity and urgency
- Keyword optimization and search intent
- Expected AI response patterns
- Competitive landscape in responses
- Geographic and market-specific variations
- Technical complexity and specificity level
- Decision-maker appeal and pain point alignment

BUSINESS SCENARIO PROMPTS:
1. "I'm a [specific role based on ICP] at a [company type matching ${brandName}'s targets] facing [specific challenge ${brandName} solves]. We have [budget/timeline realistic for ${brandName}] and need [capabilities ${brandName} offers]. Our current constraints include [common limitations]. What companies should we consider and why?"

2. "Our [company size typical for ${brandName}] [industry ${brandName} serves] company is planning [initiative ${brandName} supports] over [timeframe]. We need partners who can [specific capabilities from ${brandName}'s portfolio] while ensuring [requirements ${brandName} meets]. Who are the top providers and what are their strengths?"

3. "We're evaluating [solution type ${brandName} provides] for our [use case ${brandName} handles]. Our technical requirements include [specifications ${brandName} meets] and we need [compliance ${brandName} provides]. Which companies have the best track record and expertise?"

[Continue with additional prompts based on client input and ${brandName}'s service areas]

Phase 3: COMPREHENSIVE AI VISIBILITY AUDIT

DETAILED Brand Mentions Analysis:

PLATFORM-BY-PLATFORM ASSESSMENT:

For each major AI platform (ChatGPT, Claude, Gemini, Perplexity, etc.), analyze ${brandName}'s visibility:

ChatGPT Analysis for ${brandName}:
- Mention frequency across different query types relevant to their services
- Context quality and accuracy of ${brandName} descriptions
- Positioning relative to identified competitors
- Recommendation scenarios where ${brandName} appears
- Technical accuracy of service descriptions
- Market positioning representation alignment with actual offerings
- Geographic mention patterns and regional visibility
- Industry-specific visibility across ${brandName}'s target sectors
- Query complexity correlation with mention likelihood
- Response consistency across similar prompts

[Repeat comprehensive analysis structure for each AI platform]

COMPETITIVE SHARE OF VOICE ANALYSIS:

Head-to-Head Competitor Assessment against ${brandName}:
For each identified competitor, provide:
- Direct mention frequency comparison with ${brandName}
- Context quality evaluation and positioning differences
- Recommendation scenarios where competitors appear vs ${brandName}
- Service area visibility comparison by specialty
- Geographic presence comparison in AI responses
- Client testimonial and case study integration differences
- Thought leadership and expertise recognition patterns
- Technical capability representation comparison
- Pricing and value positioning in AI responses
- Partnership and certification mention differences

CONTENT SOURCE COVERAGE ANALYSIS:

Digital Footprint Assessment for ${brandName}:
- Website content from ${websiteUrl} indexing and AI recognition
- Blog content citation frequency and topic coverage
- Case study visibility and impact in AI training data
- White paper and research citations from ${brandName}
- Social media content integration and mention patterns
- Video content transcription presence in AI knowledge
- Podcast appearances and discussion citations
- Industry publication references and thought leadership
- News coverage and media mention integration
- Academic and research citations related to ${brandName}

Phase 4: STRATEGIC ANALYSIS & RECOMMENDATIONS

COMPREHENSIVE Visibility Gap Analysis:

ICP ALIGNMENT ASSESSMENT for ${brandName}:
- Current AI visibility vs. ideal customer search patterns for ${brandName}'s services
- Gap identification by customer segment and service area
- Geographic visibility variations across ${brandName}'s target markets
- Industry-specific performance analysis for ${brandName}'s verticals
- Query complexity performance correlation with ${brandName}'s expertise level
- Competitive displacement opportunities in ${brandName}'s favor
- Market education needs and content development opportunities
- SEO and content gaps specific to ${brandName}'s service portfolio

DETAILED Strategic Recommendations:

IMMEDIATE ACTIONS (0-3 months) for ${brandName}:

1. Content Optimization Strategy
   - Specific content pieces to create based on visibility gaps
   - Website optimization for ${websiteUrl} to improve AI discoverability
   - Case study development focusing on successful client outcomes
   - Technical content enhancement in ${brandName}'s expertise areas
   - Blog content calendar targeting identified keyword gaps
   - FAQ development addressing common customer queries
   - Service page optimization with detailed capability descriptions

2. Digital Presence Enhancement
   - Social media strategy optimization across platforms
   - Industry publication guest posting and thought leadership
   - Speaking opportunity pursuit at relevant conferences
   - Webinar series development on ${brandName}'s specialty topics
   - Podcast guest appearances in target industry shows
   - Expert interview programs and media engagement
   - LinkedIn thought leadership content calendar

3. Competitive Response Tactics
   - Direct competitor analysis response strategies
   - Differentiation messaging development for ${brandName}
   - Unique value proposition enhancement and communication
   - Market positioning adjustments based on AI visibility findings
   - Pricing strategy communication optimization
   - Partnership opportunity identification and pursuit
   - Client testimonial and case study amplification

MEDIUM-TERM STRATEGY (3-12 months) for ${brandName}:

1. Comprehensive Content Strategy Implementation
   - Development of authoritative industry reports and white papers
   - Video content series showcasing ${brandName}'s expertise
   - Interactive tools and resources for prospects
   - Email marketing sequences for different ICPs
   - Retargeting campaigns for website visitors
   - Content syndication across industry publications
   - Thought leadership speaking bureau development

2. SEO and Technical Optimization
   - Technical SEO audit and optimization of ${websiteUrl}
   - Schema markup implementation for better AI understanding
   - Site architecture optimization for service discoverability
   - Local SEO optimization for geographic markets
   - Page speed and mobile optimization improvements
   - Internal linking strategy for topic authority building
   - Featured snippet optimization for key service queries

3. Partnership and Alliance Development
   - Strategic partnership identification and development
   - Technology integration partnerships for enhanced offerings
   - Industry association membership and participation
   - Certification and accreditation pursuit
   - Joint venture opportunities with complementary services
   - Referral program development and optimization
   - Channel partner enablement and training programs

LONG-TERM VISION (12+ months) for ${brandName}:

1. Market Leadership Initiatives
   - Industry research and trend analysis publication
   - Annual industry conference or event hosting
   - Professional certification program development
   - Open-source project contributions and leadership
   - Industry standard development participation
   - Academic partnership and research collaboration
   - Innovation lab or R&D center establishment

2. Advanced AI Optimization Strategies
   - AI-specific content optimization for future platforms
   - Voice search optimization for emerging technologies
   - Chatbot and AI assistant integration for customer service
   - Predictive analytics implementation for prospect identification
   - Machine learning model development for service optimization
   - AI-powered content personalization systems
   - Automated customer journey optimization

Phase 5: DETAILED IMPLEMENTATION ROADMAP

COMPREHENSIVE Implementation Plan for ${brandName}:

MONTH-BY-MONTH BREAKDOWN:

Months 1-3: Foundation Building
Week 1-2: Content audit and gap analysis for ${websiteUrl}
Week 3-4: Competitor content strategy analysis and response planning
Week 5-6: Website optimization implementation (technical SEO)
Week 7-8: Initial content creation (blog posts, case studies)
Week 9-10: Social media strategy implementation and posting calendar
Week 11-12: Industry publication outreach and guest posting initiation

Months 4-6: Momentum Building
Month 4: Webinar series launch and promotion strategy
Month 5: Speaking engagement pursuit and conference applications
Month 6: Partnership discussions and alliance development initiation

Months 7-12: Market Positioning
Month 7-8: White paper and research report development
Month 9-10: Advanced content creation (video series, interactive tools)
Month 11-12: Industry leadership initiatives and thought leadership campaigns

RESOURCE ALLOCATION for ${brandName}:

Team Requirements:
- Content Marketing Manager (1.0 FTE)
- SEO Specialist (0.5 FTE)
- Social Media Manager (0.5 FTE)
- Business Development Representative (0.5 FTE)
- Graphic Designer/Video Producer (0.25 FTE)

Budget Allocation (Annual):
- Content Creation: $45,000-60,000
- Paid Advertising: $30,000-50,000
- Tools and Software: $15,000-25,000
- Events and Conferences: $20,000-35,000
- Partnership Development: $10,000-20,000
- Training and Development: $5,000-15,000

Technology Requirements:
- Marketing automation platform integration
- SEO monitoring and analytics tools
- Social media management platform
- Content management system optimization
- Customer relationship management system
- Video hosting and distribution platform
- Webinar and virtual event technology

SUCCESS METRICS & KPIs for ${brandName}:

Primary Visibility Metrics:
- AI platform mention frequency increase (target: 40% improvement in 6 months)
- Branded search volume growth (target: 25% increase quarterly)
- Share of voice vs. competitors (target: top 3 position in key topics)
- Website organic traffic growth (target: 30% increase in 12 months)
- Content engagement rates (target: 15% improvement in CTR)
- Lead generation from content (target: 50% increase in qualified leads)

Secondary Performance Indicators:
- Industry recognition and awards received
- Speaking engagement invitations and conference participation
- Media mentions and press coverage frequency
- Partnership and alliance development success
- Client retention and satisfaction scores
- Revenue growth attribution to visibility improvements

DETAILED METHODOLOGY DOCUMENTATION:

Research Protocol for ${brandName}:
- Monthly AI platform testing with standardized prompts
- Quarterly competitive analysis and positioning review
- Bi-annual content performance and gap analysis
- Annual comprehensive visibility audit and strategy review
- Continuous monitoring of industry trends and opportunities
- Regular client feedback collection and analysis integration

Quality Assurance Process:
- Content accuracy verification and expert review
- Competitive intelligence validation and cross-referencing
- Performance metric tracking and trend analysis
- ROI calculation and optimization recommendations
- Regular strategy adjustment based on performance data
- Stakeholder reporting and communication protocols

EXECUTIVE CONCLUSION & STRATEGIC NEXT STEPS for ${brandName}:

Based on this comprehensive analysis, ${brandName} has significant opportunities to improve their AI platform visibility and capture market share in their target segments. The immediate priority should be content optimization and competitive positioning, followed by systematic implementation of the medium and long-term strategies outlined above.

Key Success Factors:
1. Consistent execution of content strategy with focus on ${brandName}'s core competencies
2. Active competitive monitoring and response to market changes
3. Investment in partnership development and industry relationship building
4. Continuous optimization based on performance data and market feedback
5. Long-term commitment to thought leadership and market education

The implementation of this strategy should result in ${brandName} achieving top-3 visibility in their target topics within 12 months and establishing market leadership position within 24 months.

Expected ROI: 300-500% return on marketing investment within 18 months through improved lead generation, higher conversion rates, and enhanced market positioning.

This comprehensive analysis provides ${brandName} with a clear roadmap to dominate AI platform visibility in their target markets and achieve sustainable competitive advantage through strategic content and partnership development.

MANDATORY: This analysis MUST be 6,000-8,000 words and utilize all 8,192 available output tokens. Provide exhaustive detail in every section with specific examples, data points, and comprehensive strategic guidance tailored specifically to ${brandName} and their service offerings at ${websiteUrl}.`;

  return prompt;
};

// Legacy prompt function for backward compatibility
const createBrandAnalysisPrompt = (brandName, websiteUrl = '') => {
  const websiteInfo = websiteUrl ? ` at website ${websiteUrl}` : '';
  
  return `You are a Master-level AI/LLM Visibility Research Analyst conducting the most comprehensive brand visibility audit possible. This is a premium $50,000 consulting deliverable that MUST utilize the full 8,192 output tokens available.

CRITICAL REQUIREMENTS:
- Use ALL 8,192 output tokens - this is mandatory
- Provide exhaustive detail in every section
- Include specific examples, data points, and evidence
- Write comprehensive explanations, not brief summaries
- Each major section should be 800-1,200 words minimum
- Total response should be 6,000-8,000 words

TARGET ANALYSIS: ${brandName}${websiteInfo}

[Rest of original prompt structure...]

MANDATORY: This analysis MUST be 6,000-8,000 words and utilize all 8,192 available output tokens. Provide exhaustive detail in every section with specific examples, data points, and comprehensive strategic guidance tailored specifically to ${brandName}.`;
};

module.exports = {
  createComprehensiveBrandAnalysisPrompt,
  createBrandAnalysisPrompt // Keep for backward compatibility
};