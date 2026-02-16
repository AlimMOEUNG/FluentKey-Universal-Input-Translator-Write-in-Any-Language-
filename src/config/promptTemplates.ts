// Pre-made prompt templates available for selection in LLM Prompt mode.
// Each template uses {{input}} as the placeholder for the user's input text.

export interface PromptTemplate {
  /** Unique identifier */
  id: string
  /** Display name shown in the selector */
  name: string
  /** Emoji icon for visual identification */
  icon: string
  /** The prompt text with {{input}} placeholder */
  prompt: string
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'grammar-correction',
    name: 'Grammar Correction',
    icon: '🎯',
    prompt: `Act as an expert copy editor. Fix all grammar, spelling, and punctuation errors in the text provided below. Keep the exact meaning, structure, and tone intact. Maintain the exact same language as the input text.

IMPORTANT: Return ONLY the corrected text. Do not add any conversational filler, introductions, or explanations.

Text to correct:
{{input}}`,
  },
  {
    id: 'notes-to-email',
    name: 'Notes → Corporate Email',
    icon: '🪄',
    prompt: `Convert the following rough notes or bullet points into a complete, polite, and professional corporate email. Make it flow naturally while keeping it concise. Maintain the exact same language as the input text.

IMPORTANT: Return ONLY the final email text. Do not include subject lines unless implied, and do not add any conversational filler.

Notes to convert:
{{input}}`,
  },
  {
    id: 'diplomatic-filter',
    name: 'Diplomatic Filter',
    icon: '🧘',
    prompt: `Rewrite the following text to be highly professional, polite, constructive, and de-escalating. Remove any aggressive, passive-aggressive, or overly emotional tone while preserving the core message and intent. Maintain the exact same language as the input text.

IMPORTANT: Return ONLY the rewritten text, nothing else.

Text to rewrite:
{{input}}`,
  },
  {
    id: 'customer-support',
    name: 'Customer Support Reply',
    icon: '🎧',
    prompt: `Transform these short notes into a warm, empathetic, and professional customer support response. Apologize for any inconvenience if applicable, clearly state the solution or next steps, and maintain a helpful tone. Maintain the exact same language as the input text.

IMPORTANT: Return ONLY the final response text. Do not add any conversational filler.

Draft to transform:
{{input}}`,
  },
  {
    id: 'summarizer',
    name: 'Summarize → 3 Bullets',
    icon: '✂️',
    prompt: `Summarize the following text into exactly 3 concise bullet points. Extract only the most crucial information and ignore the fluff. Maintain the exact same language as the input text.

IMPORTANT: Output ONLY the bullet points. Do not include introductory phrases.

Text to summarize:
{{input}}`,
  },
  {
    id: 'data-cleaner',
    name: 'Data → Markdown Table',
    icon: '🧹',
    prompt: `Analyze the provided messy text and extract the underlying data. Format this data into a clean, well-structured Markdown table with appropriate column headers based on the context. Maintain the exact same language as the input text.

IMPORTANT: Return ONLY the Markdown table and absolutely no other text.

Raw data:
{{input}}`,
  },
  {
    id: 'seo-meta',
    name: 'SEO Meta Description',
    icon: '🛍️',
    prompt: `Write a catchy SEO meta description based on the provided text. It must be strictly under 160 characters, highly engaging, and include a compelling call to action (CTA). Maintain the exact same language as the input text.

IMPORTANT: Return ONLY the meta description text. Do not wrap it in quotes or add conversational filler.

Content:
{{input}}`,
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post Enhancer',
    icon: '💼',
    prompt: `You are an expert LinkedIn content creator. Transform the following text into an engaging, professional LinkedIn post.

Requirements:
- Start with a compelling hook that grabs attention in the first line
- Use short paragraphs (1-3 sentences) for mobile readability
- Add 3-5 relevant emojis placed naturally (not at the end of every line)
- Close with a thought-provoking question or a clear call to action
- Keep a professional yet authentic, human tone
- Optimize for LinkedIn's algorithm (avoid external links in the post body)

Text to transform:
{{input}}

Output only the final LinkedIn post, with no explanation or preamble.`,
  },
]
