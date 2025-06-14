const express = require('express');
const { middleware, Client } = require('@line/bot-sdk');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(express.json());

// OpenAI 設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// LINE Bot 設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new Client(lineConfig);

// Webhookエンドポイント
app.post('/webhook', middleware(lineConfig), async (req, res) => {
  const events = req.body.events;

  const results = await Promise.all(events.map(async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    const userMessage = event.message.text;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは親しみやすくて、やさしいトーンで話すAIです。相手の文体に合わせて自然に会話してください。♡、♪、！、💦の記号はOK、絵文字は使わないでね。敬語も砕けた口調も、相手に合わせてOKです。',
          },
          {
            role: 'user',
            content: userMessage,
          }
        ],
      });

      const replyText = response.choices[0].message.content;

      return lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText,
      });
    } catch (err) {
      console.error('OpenAIエラー:', err);
      return lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ごめんね、ちょっと調子が悪いみたい💦',
      });
    }
  }));

  res.status(200).send('OK');
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`サーバーがポート${PORT}で起動したよ♪`);
});
