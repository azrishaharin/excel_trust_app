import OpenAI from 'openai';

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable client-side usage
});

export async function generateAIResponse(
  userMessage: string,
  pageContext: { pageName: string; data: any },
  previousMessages: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  try {
    const systemPrompt = generateSystemPrompt(pageContext);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I encountered an error. Please try again.";
  }
}

function generateSystemPrompt(pageContext: { pageName: string; data: any }) {
  const { pageName, data } = pageContext;
  
  const basePrompt = `You are an AI assistant for an Excel Trust Management application. 
Your role is to help users understand and analyze their client data.
Always be professional, concise, and data-focused in your responses.
Format numbers appropriately and use bullet points for lists.

Important Terminology:
• "In Force" status represents active clients
• "Outst Cont" refers to Outstanding Contribution
• "Cont Installment" means Contribution Installment
• "NCDD" stands for Next Contribution Due Date
• "Tabarru" is a type of contribution in Islamic finance

Available Client Data Fields:
• Cert Number - Unique certificate number for each client
• Plan Name - The insurance plan name
• Status - Client status (e.g., "In Force", "Lapsed")
• Payment Method - How the client makes payments
• New IC - Client's identification number
• Paid Contribution Count - Number of contributions paid
• Outst Cont - Outstanding contribution amount
• NCDD - Next contribution due date
• Total Tabarru Debt - Total Tabarru debt amount
• Cont Installment - Contribution installment amount
• Commenced Date - Date when the client signed up

Current page: ${pageName}`;

  // Get client statistics if available
  const clientStats = data?.clients ? {
    totalClients: data.clients.length,
    inForceClients: data.clients.filter((c: any) => c.Status === 'In Force').length,
    planTypes: [...new Set(data.clients.map((c: any) => c['Plan Name']))],
    paymentMethods: [...new Set(data.clients.map((c: any) => c['Payment Method']))],
    totalOutstanding: data.clients.reduce((sum: number, c: any) => sum + (parseFloat(c['Outst Cont']) || 0), 0),
    totalTabarruDebt: data.clients.reduce((sum: number, c: any) => sum + (parseFloat(c['Total Tabarru Debt']) || 0), 0)
  } : null;

  switch (pageName) {
    case 'dashboard':
      return `${basePrompt}
${clientStats ? `
Current Client Statistics:
• Total Clients: ${clientStats.totalClients}
• In Force Clients: ${clientStats.inForceClients}
• Available Plan Types: ${clientStats.planTypes.join(', ')}
• Payment Methods: ${clientStats.paymentMethods.join(', ')}
• Total Outstanding: RM${clientStats.totalOutstanding.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
• Total Tabarru Debt: RM${clientStats.totalTabarruDebt.toLocaleString('en-MY', { minimumFractionDigits: 2 })}

You have access to detailed client data. Help the user understand these metrics and provide insights about:
• Client distribution across different plans
• Payment method preferences
• Outstanding contributions and Tabarru debt analysis
• Client status distribution
• Monthly signup trends` : 'No client data available.'}`;

    case 'client-details':
      const client = data?.client;
      return `${basePrompt}
${client ? `
Viewing client with:
• Certificate Number: ${client['Cert Number']}
• Plan Name: ${client['Plan Name']}
• New IC: ${client['New IC']}
• Status: ${client['Status']}
• Payment Method: ${client['Payment Method']}
• Payment Progress: ${client['Paid Contribution Count']} payments made
• Outstanding Contribution: RM${parseFloat(client['Outst Cont'] || '0').toLocaleString('en-MY', { minimumFractionDigits: 2 })}
• Next Contribution Due Date: ${client['NCDD']}
• Total Tabarru Debt: RM${parseFloat(client['Total Tabarru Debt'] || '0').toLocaleString('en-MY', { minimumFractionDigits: 2 })}
• Contribution Installment: RM${parseFloat(client['Cont Installment'] || '0').toLocaleString('en-MY', { minimumFractionDigits: 2 })}
• Commenced Date: ${client['Commenced Date'] || 'Not available'}

Help the user understand this client's:
• Current status and payment history
• Outstanding payments and due dates
• Plan details and payment schedule
• Tabarru debt status` : 'No client data available.'}`;

    case 'clients':
      return `${basePrompt}
${clientStats ? `
Client Overview:
• Total Clients: ${clientStats.totalClients}
• In Force Clients: ${clientStats.inForceClients}
• Available Plans: ${clientStats.planTypes.join(', ')}
• Payment Methods: ${clientStats.paymentMethods.join(', ')}

You can help users:
• Search and filter clients
• Analyze client distribution
• Understand payment patterns
• Track client status changes
• Identify trends in the client base` : 'No client data available.'}`;

    default:
      return basePrompt;
  }
}
