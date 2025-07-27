/**
 * Brand Analysis Prompt Template
 * This is your original prompt with dynamic brand substitution
 */

const createBrandAnalysisPrompt = (brandName) => {
  return `Perform a comprehensive brand visibility and share-of-voice audit for the brand "${brandName}" across major Large Language Models (LLMs) such as OpenAI's ChatGPT, Google Bard, Anthropic Claude, and other similar AI platforms. The audit should address the following points:

* Brand Mentions in LLM Responses: Identify instances where ${brandName} is mentioned by these LLMs. Include both exact name mentions and closely related terms. Describe the contexts of these mentions – for example, does the LLM reference ${brandName} when discussing certain services or products, or when answering specific user queries?

* Contexts of Mentions (Products/Services): Detail the scenarios in which the LLMs refer to ${brandName} (e.g. recommending ${brandName} for a particular service, mentioning a ${brandName} product as a solution, etc.). Explain what prompts or questions tend to trigger references to ${brandName}.

* Coverage of High-Value Phrases: Determine the number and variety of key queries or "high-ticket" phrases (important, high-volume keywords in ${brandName}'s industry/domain) for which ${brandName} appears in LLM-generated answers. In other words, assess how visible ${brandName} is in LLM responses for the most valuable or common user questions in its niche. List some of these critical phrases and note whether or not ${brandName} shows up for each.

* Share of Voice vs. Competitors: Evaluate ${brandName}'s share of voice in LLM outputs relative to its top competitors. Identify key competitor brands in the same space and compare how often or prominently they are mentioned by LLMs versus ${brandName} for similar queries. For example, for the high-value queries identified, note if competitors are being recommended or cited more frequently than ${brandName}. Provide any available metrics or observations (e.g. "${brandName} was mentioned in 5 out of 10 relevant AI answers, compared to Competitor X's 8 out of 10") to illustrate this comparison.

* Platform and Content Source Coverage: Cover references to ${brandName} across different content sources utilized by LLMs. This includes:
   * Web Results and Citations: Whether LLMs cite web articles, news, or blog content that mention ${brandName}.
   * AI-Generated Content: Mentions of ${brandName} within the LLMs' own generated answers or explanations.
   * Academic/Research References: Any citations of ${brandName} in scholarly content or reputable reports that the LLM might use. Ensure the audit encompasses a broad range of platforms and content types where ${brandName} could appear.

* Global vs. Regional Presence: Note if there are any regional or language-specific differences in ${brandName}'s visibility. For instance, does ${brandName} appear more in responses tailored to certain countries or languages? Mention any notable variations in share of voice across different geographies if applicable.

* Citations and Evidence: For each key finding, provide supporting evidence. This should include citations or references to sources – for example, links to specific examples where an LLM mentioned ${brandName}, or data from tools/reports on LLM answer trends. Cite credible sources that back up the statements about how often ${brandName} or its competitors are mentioned.

Finally, organize the output in a clear, reader-friendly format. Use descriptive headings for each section of the analysis, bullet points or numbered lists for detailed items, and short paragraphs. The goal is to present a well-structured report that clearly shows how visible ${brandName} is within AI-generated content and how its presence compares to competitors, with all claims backed by references.`;
};

module.exports = {
  createBrandAnalysisPrompt
};