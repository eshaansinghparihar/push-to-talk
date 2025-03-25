import express from 'express';
import { configDotenv } from 'dotenv';
import { Server } from 'socket.io';
import generateResponse from './prompts/generateResponse.js';
import getOpenAIResponse from './utils/getOpenAIResponse.js';

configDotenv();

const app = express();

const port = 3001;
const ioPort = 5000;

const io = new Server(ioPort, {
    cors: {
        origin: '*',
    }
});

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('disconnect', function () {
        console.log('User disconnected');
    });

    socket.on('user message', async function (conversation) {
        const prompt = generateResponse(conversation);
        try {
            const respone = await getOpenAIResponse(prompt);
            conversation.push({ role: 'bot', content: respone.data.choices[0].message.content });
            socket.emit('bot message', respone.data.choices[0].message.content);
        }
        catch (error) {
            console.error('Error while querying OpenAI:', new Error(error));
            socket.emit('bot message', new Error(error));
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}
);

