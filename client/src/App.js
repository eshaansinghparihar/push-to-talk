import './App.css';
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function App() {

  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      alert("Speech Recognition is not supported in this browser.");
    }
  }, []);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const synth = window.speechSynthesis;
  const utterThis = new SpeechSynthesisUtterance();

  const [conversation, setConversation] = useState([]);
  const [clicked, setClicked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userText, setUserText] = useState('Hey');
  const [botText, setBotText] = useState('Hello');
  const [socket, setSocket] = useState(null);

  useEffect(() => {

    const host = process.env.REACT_APP_SOCKET_URL;
    console.log(host);

    const socketInstance = io(host);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to the server');
    });

    socketInstance.on('bot message', (msg) => {
      console.log('Bot Message: ' + JSON.stringify(msg));
      setBotText(msg);
      setConversation([...conversation, { role: 'bot', content: msg }]);
      handleSynthesis(msg);
    });

  }, []);

  function handleSynthesis(text) {
    utterThis.text = text;
    utterThis.voice = synth.getVoices().filter(voice => voice.lang === 'en-US' && voice.name === 'Samantha')[0];
    utterThis.pitch = 1;
    utterThis.rate = 0.75;
    setIsSpeaking(true);
    synth.speak(utterThis);
    utterThis.onend = () => setClicked(false);
  }

  function handleListen() {

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    }

    setClicked(true);

    setBotText('Go Ahead, I am Listening...');
    setUserText('...');

    recognition.start();

    recognition.onspeechstart = () => {
      console.log('Speech detected');
      setBotText('...Hmm, Listening...');
    }

    recognition.onspeechend = () => {
      recognition.stop();
      setBotText('Gotcha, lemme think...');
    }

    recognition.onresult = (event) => {

      const speechResult = event.results[event.results.length - 1][0].transcript;

      console.log('Speech Result', speechResult);

      setUserText(speechResult);

      const updatedConversation = [...conversation, { role: 'user', content: speechResult }];
      setConversation(updatedConversation);

      socket.emit('user message', updatedConversation);
    }

    recognition.onerror = (event) => {
      console.log(event, 'Error occured.');
      const msg = 'Sorry, Could you please come again...';
      setBotText(msg);
      handleSynthesis(msg);
    }
  }


  return (
    <div className="App">
      <div className="App-body">
        <p style={{padding : '5vh'}}><b>You:</b> <em>{userText}</em></p>
        <button onClick={handleListen}>
          <img
            src={clicked ? '/animation/main.gif' : '/animation/main.jpg'}
            alt="button image"
            style={{ maxWidth: '350px', maxHeight: '350px' }}
          />
        </button>
        <p style={{padding : '5vh'}}><b>Bot:</b> <em>{botText}</em></p>
      </div>
    </div>
  );
}

export default App;
