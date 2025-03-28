import path from 'path';
import express from 'express';
import http from 'http';
import { configDotenv } from 'dotenv';
import { Server } from 'socket.io';
import generateResponse from './prompts/generateResponse.js';
import getOpenAIResponse from './utils/getOpenAIResponse.js';
import { getGlobals } from 'common-es'

const { __dirname } = getGlobals(import.meta.url)

configDotenv({ path: path.resolve(__dirname, '../.env')});

const app = express();
const server = http.createServer(app);

const port = 3001;

const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

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

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
}
);

