const { app } = require('@azure/functions');
const axios = require('axios');

const endpointRaw = process.env.OPENAI_API_ENDPOINT || '';
const apiKey = process.env.OPENAI_API_KEY;
const deploymentName = 'gpt-35-turbo-2';
const apiVersion = '2025-01-01-preview';

const endpoint = endpointRaw.endsWith('/') ? endpointRaw : endpointRaw + '/';

app.http('botMessage', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'messages',
    handler: async (request, context) => {
        const activity = await request.json();
        const userMessage = activity?.text || '';

        context.log(`🤖 Incoming message: ${userMessage}`);
        context.log("🔍 Using endpoint:", endpoint);
        context.log("🔍 API Key present:", !!apiKey);

        const systemPrompt = `
      Bạn là trợ lý AI của MomUni, chỉ trả lời các câu hỏi về:
      - Thai kỳ
      - Chăm sóc trẻ sơ sinh và trẻ nhỏ
      - Dinh dưỡng mẹ và bé
      - Tâm lý phụ nữ, giáo dục sớm
      Nếu người dùng hỏi ngoài chủ đề, hãy từ chối lịch sự.
    `;

        try {
            const url = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
            context.log("🌐 Requesting Azure OpenAI at:", url);

            const response = await axios.post(
                url,
                {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': apiKey
                    }
                }
            );

            const reply = response.data.choices?.[0]?.message?.content || 'Xin lỗi, không có phản hồi từ AI.';

            return {
                status: 200,
                jsonBody: {
                    type: 'message',
                    text: reply
                }
            };
        } catch (error) {
            context.error('❌ Azure OpenAI error:', error.response?.data || error.message);

            return {
                status: 200,
                jsonBody: {
                    type: 'message',
                    text: 'Xin lỗi, trợ lý MomUni đang gặp sự cố. Bạn thử lại sau nhé.'
                }
            };
        }
    }
});
