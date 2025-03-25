import express from 'express';
import path from 'path';
import { configDotenv } from 'dotenv';
import { Server } from 'socket.io';
import generateResponse from './prompts/generateResponse.js';
import getOpenAIResponse from './utils/getOpenAIResponse.js';
import { getGlobals } from 'common-es'

configDotenv();

const app = express();

const port = 3001;
const ioPort = 5000;

const io = new Server(ioPort, {
    cors: {
        origin: '*',
    }
});

const { __dirname } = getGlobals(import.meta.url)
app.use(express.static(path.resolve(__dirname, '../client/build')));

io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('disconnect', function () {
        console.log('User disconnected');
    });

    socket.on('user message', async function (conversation) {
        const prompt = generateResponse(conversation);
        try {
            const respone = await getOpenAIResponse(prompt);
            socket.emit('bot message', respone.data.choices[0].message.content);
        }
        catch (error) {
            console.error('Error while querying OpenAI:', new Error(error));
            socket.emit('bot message', new Error(error));
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
    });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}
);

