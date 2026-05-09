export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const apiKey = process.env.GEMINI_API_KEY;
  const { query } = req.body;

  const systemInstruction = "You are an elite math tutor for Grade 4 students at Imperial International School. Your tone is encouraging, clear, and professional. Focus strictly on GCF, LCM, Simplest form fractions, and Quadrilaterals based on their semester worksheet. Use bullet points for steps and bold important numbers.";

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: query }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'AI Brain error' });
  }
}
