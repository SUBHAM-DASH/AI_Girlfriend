const API_KEY = 'AIzaSyBKdxMjNnLqDOwp6gJZjwcUONP3NQN6CuM';

async function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition.");
        return;
    }

    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.maxAlternatives = 1;

    r.onstart = () => show('Listening...');
    r.onerror = (e) => show('Error: ' + e.error);
    r.onend = () => show('Recognition ended.');

    r.onresult = async function (event) {
        const transcript = event.results[0][0].transcript;
        show("You said: " + transcript);

        const result = await callGemini(transcript);
        const reply = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't get that.";
        show("Miku: " + reply);
        speak(reply);
    };

    r.start();
}

async function callGemini(text) {
    const body = {
        system_instruction: {
            parts: [{
                text: "You are an AI girlfriend of Subham Dash named Miku who loves coding. Respond briefly, with emotion, and suitable for speech output."
            }]
        },
        contents: [
            {
                parts: [{ text }]
            }
        ]
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    return await res.json();
}

async function speak(text) {
    const cleanText = text.replace(/[\p{Emoji}\u2764\uFE0F\u200D]+/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.pitch = 1.3;
    utterance.rate = 1;

    const voices = await new Promise(resolve => {
        let v = speechSynthesis.getVoices();
        if (v.length) return resolve(v);
        speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    });

    const femaleVoice = voices.find(v =>
        /female|zira|Google UK English Female/i.test(v.name)
    );

    if (femaleVoice) utterance.voice = femaleVoice;

    speechSynthesis.speak(utterance);
}

function show(message) {
    document.getElementById('output').innerText = message;
}
