/**
 * Updated Brand Analysis Prompt Template for Oxagile Visibility Research
 * Based on the comprehensive LLM visibility audit requirements
 */

const createBrandAnalysisPrompt = (brandName) => {
  return `Consider Yourself a Master of AI/LLM Visibility research. Perform a comprehensive brand visibility and share-of-voice audit for ${brandName} across major Large Language Models (LLMs) such as OpenAI's ChatGPT, Google Bard, Anthropic Claude, Gemini and other similar AI platforms.

**Phase 1: Brand Research & ICP Development**

**Step 1: Brand Intelligence Gathering**
• Analyze ${brandName}'s services, positioning, and value proposition
• Research their client portfolio and case studies
• Identify their key market differentiators and specializations
• Review their content, thought leadership, and public statements

**Step 2: Ideal Customer Profile (ICP) Creation**
Based on the brand research, develop 1-2 detailed ICPs that include:
• Role/Title: Specific decision-maker positions (e.g., CMO, Communications Director, VP Marketing)
• Industry Vertical: Key sectors ${brandName} serves
• Company Profile: Size, growth stage, and characteristics of target companies
• Pain Points: Specific challenges these ICPs face
• Search Behavior: How and when these ICPs would use AI platforms for solutions

**Step 3: Topic Identification**
From the ICPs, identify 2-3 core topics that represent:
• Primary service areas where ${brandName} wants to be recognized
• Problems/challenges the ICPs actively seek solutions for
• High-value business opportunities for ${brandName}

**Phase 2: Realistic Prompt Development**

**Step 4: Prompt Creation**
For each identified topic, develop 1-2 realistic prompts that:
• Reflect actual questions ICPs would ask AI platforms
• Include urgency, context, or specific business scenarios
• Trigger responses where ${brandName} should logically be mentioned or recommended

**Phase 3: Comprehensive AI Visibility Audit**

**Brand Mentions in LLM Responses**
For each realistic prompt, analyze:
• Direct Mentions: Exact references to ${brandName} by name
• Contextual Relevance: Whether mentions occur in appropriate contexts
• Positioning: How ${brandName} is described and positioned
• Recommendation Scenarios: Specific situations where ${brandName} is suggested
• Quality of Context: Whether mentions align with ${brandName}'s desired positioning

**Coverage of High-Value Scenarios**
Evaluate ${brandName}'s visibility across the developed prompts:
• Response Rate: Percentage of relevant prompts where ${brandName} appears
• Mention Quality: Accuracy and favorability of how ${brandName} is described
• Competitive Context: Whether competitors appear alongside or instead of ${brandName}
• Authority Positioning: Whether ${brandName} is presented as a subject matter expert

**Share of Voice vs. Competitors**
Compare ${brandName}'s visibility against key competitors:
• Head-to-Head Analysis: For each prompt, identify which competitors appear
• Mention Frequency: Quantify how often ${brandName} vs. competitors are mentioned
• Positioning Comparison: Analyze how competitors are described vs. ${brandName}
• Market Gaps: Identify prompts where neither ${brandName} nor key competitors appear consistently

**Platform and Content Source Coverage**
Analyze the breadth of ${brandName}'s digital footprint:
• Web Results and Citations: Whether LLMs cite articles, news, or content mentioning ${brandName}
• AI-Generated Content: How ${brandName} appears in LLMs' own knowledge base
• Academic/Research References: Citations in scholarly content or industry reports
• Content Source Diversity: Range of platforms and content types contributing to visibility

**Global vs. Regional Presence**
Assess geographic variations in visibility:
• Market-Specific Prompts: Test prompts with geographic qualifiers relevant to ${brandName}'s markets
• Language Variations: If applicable, test prompts in different languages
• Regional Competitor Analysis: Compare visibility against regional vs. global competitors

**Phase 4: Strategic Analysis & Recommendations**

**Visibility Gap Analysis**
• ICP Alignment: How well current visibility matches target ICP search behavior
• Topic Coverage: Which core topics show strong vs. weak visibility
• Prompt Performance: Which types of questions favor ${brandName} vs. competitors
• Missed Opportunities: High-value scenarios where ${brandName} should appear but doesn't

**Competitive Intelligence**
• Competitor Strategies: Analyze what competitors do well to achieve visibility
• Market Positioning: How ${brandName} is perceived relative to the competitive landscape
• White Space Opportunities: Areas where no strong players dominate AI responses

**Strategic Recommendations**
• Content Strategy: Specific content types needed to improve visibility for target prompts
• SEO & Digital Strategy: Technical improvements to enhance AI platform recognition
• Thought Leadership: Areas where ${brandName} should build authority
• Partnership Opportunities: Potential collaborations to increase visibility
• Long-term Positioning: Strategic moves to dominate key search scenarios

**Phase 5: Implementation Roadmap**

**Immediate Actions (0-3 months)**
• High-impact, low-effort improvements based on audit findings
• Content optimization for top-performing prompt categories

**Medium-term Strategy (3-12 months)**
• Comprehensive content and digital strategy implementation
• Competitive positioning improvements

**Long-term Vision (12+ months)**
• Market leadership initiatives based on identified opportunities
• Advanced AI optimization strategies

**Output Format Requirements:**
Present findings in a clear, executive-ready format with:
• Executive Summary: Key findings and strategic implications
• Detailed Analysis: Complete breakdown by ICP, topic, and prompt performance
• Competitive Landscape: Visual representation of share of voice
• Evidence Documentation: Specific examples and data points
• Action Plan: Prioritized recommendations with timeline and success metrics

Please provide specific, actionable insights with concrete examples and measurable recommendations for improving ${brandName}'s visibility when target customers are actively seeking solutions through AI platforms.`;
};

module.exports = {
  createBrandAnalysisPrompt
};