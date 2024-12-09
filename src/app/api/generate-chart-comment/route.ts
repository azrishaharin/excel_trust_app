import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chartType, data, metrics } = body;

    const prompt = `As a data analyst, provide a concise and insightful comment about the following chart data:
Chart Type: ${chartType}
Data: ${JSON.stringify(data)}
Key Metrics: ${JSON.stringify(metrics)}

Generate a brief, professional comment (max 2 sentences) that:
1. Highlights the most significant insight
2. Provides actionable business implications
3. Uses precise numbers and percentages where relevant

Keep the tone professional and analytical. Focus on the most important trends or patterns.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional data analyst providing insights about trust management data. Keep responses concise and focused on business implications.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    const comment = completion.choices[0]?.message?.content || 'No insight available.';

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Error generating chart comment:', error);
    return NextResponse.json(
      { error: 'Failed to generate chart comment' },
      { status: 500 }
    );
  }
}
