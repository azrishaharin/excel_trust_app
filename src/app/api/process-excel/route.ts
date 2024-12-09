import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const password = formData.get('password');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const flaskResponse = await fetch('http://127.0.0.1:5002/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await flaskResponse.json();
    return NextResponse.json(result, { status: flaskResponse.status });
  } catch (error: any) {
    console.error('Error forwarding request to Flask server:', error);
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 });
  }
}