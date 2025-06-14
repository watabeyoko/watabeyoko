const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const { middleware, Client } = require('@line/bot-sdk');
require('dotenv').config();

const app = express();
app.use(express.json());

// LINE bot 設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const lineClient = new Client(lineConfig);

// OpenAI 設定
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// LINEからのWebhookイベント処理
app.post('/webhook', middleware(lineConfig), async (req, res) => {
  const events = req.body.events;
  const results = await Promise.all(events.map(async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') return;

    const userMessage = event.message.text;
    try {
      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: userMessage }],
      });

      const replyText = response.data.choices[0].message.content;
      return lineClient.replyMessage(event.replyToken, {
        type: 'text',
        text: replyText,
      });
    } catch (err) {
      console.error(err);
    }
  }));

  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
