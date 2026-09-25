import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ExtractedInvoice {
  vendor_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  total_amount?: number;
  currency?: string;
  po_number?: string;
  line_items: Array<{
    description: string;
    quantity?: number;
    unit_price?: number;
    total: number;
  }>;
  confidence: number;
  field_confidence: Record<string, number>;
}

export async function extractInvoiceFromBase64(
  base64Data: string,
  mediaType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' = 'application/pdf'
): Promise<ExtractedInvoice> {
  const prompt = `You are an expert invoice data extraction system. Extract all structured information from this invoice document.

Return ONLY a valid JSON object with these exact fields:
{
  "vendor_name": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "total_amount": number or null,
  "currency": "3-letter ISO code like USD, EUR, GBP or null",
  "po_number": "string or null",
  "line_items": [
    {
      "description": "string",
      "quantity": number or null,
      "unit_price": number or null,
      "total": number
    }
  ],
  "confidence": 0.0-1.0 overall confidence,
  "field_confidence": {
    "vendor_name": 0.0-1.0,
    "invoice_number": 0.0-1.0,
    "invoice_date": 0.0-1.0,
    "due_date": 0.0-1.0,
    "total_amount": 0.0-1.0,
    "currency": 0.0-1.0,
    "po_number": 0.0-1.0
  }
}

Rules:
- Amounts should be numbers (not strings), e.g. 1234.56
- Dates must be YYYY-MM-DD format
- Currency must be a 3-letter ISO code (default to USD if unclear)
- Set confidence scores honestly: 0.95+ if clearly visible, 0.7-0.94 if somewhat ambiguous, below 0.7 if guessing
- If a field is not present in the document, set it to null
- Include ALL line items from the invoice`;

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse JSON from response, handling markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/) || text.match(/(\{[\s\S]+\})/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  const parsed = JSON.parse(jsonMatch[1]) as ExtractedInvoice;
  return parsed;
}

export async function draftChaseEmail(params: {
  vendor_name: string;
  invoice_number?: string;
  total_amount: number;
  currency: string;
  days_overdue: number;
  due_date?: string;
  tone: 'polite' | 'firm' | 'final';
}): Promise<{ subject: string; body: string }> {
  const toneInstructions = {
    polite:
      'Write a friendly, professional reminder. Assume it may be an oversight. Keep tone warm and understanding.',
    firm:
      'Write a firm, professional follow-up. Make clear payment is overdue and expected promptly. Remain professional but direct.',
    final:
      'Write a final notice before escalation. Be very direct that this is the last reminder before further action. Mention possible late fees or legal action if appropriate.',
  };

  const prompt = `Draft a payment chase email for an overdue invoice.

Details:
- Vendor/Client: ${params.vendor_name}
- Invoice Number: ${params.invoice_number ?? 'N/A'}
- Amount Due: ${params.currency} ${params.total_amount.toFixed(2)}
- Days Overdue: ${params.days_overdue} days
- Original Due Date: ${params.due_date ?? 'N/A'}
- Tone: ${params.tone}

Instructions: ${toneInstructions[params.tone]}

Return ONLY a JSON object with:
{
  "subject": "email subject line",
  "body": "full email body text"
}

The email should:
- Reference the specific invoice number and amount
- State exactly how many days overdue it is
- Include a professional sign-off
- Be ready to send (no placeholders like [YOUR NAME])
- Sign off as "Accounts Receivable Team"`;

  const response = await client.messages.create({
    model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/) || text.match(/(\{[\s\S]+\})/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  return JSON.parse(jsonMatch[1]) as { subject: string; body: string };
}
