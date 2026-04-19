const API_URL = "https://vintage-trusting-happier.ngrok-free.dev/api/generate"; // UPDATE THIS IF NGROK RESTARTS
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');

let currentImageBase64 = null;
const imageUpload = document.getElementById('imageUpload');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');

// Auto-resize textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto'; // Reset height
    this.style.height = (this.scrollHeight) + 'px'; // Set to actual scroll height
});

// Handle Enter key for submit, Shift+Enter for newline
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default new line
        sendMessage();
    }
});

imageUpload.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            currentImageBase64 = e.target.result.split(',')[1];
            imagePreview.src = e.target.result;
            imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

removeImageBtn.addEventListener('click', function () {
    currentImageBase64 = null;
    imageUpload.value = '';
    imagePreviewContainer.style.display = 'none';
    imagePreview.src = '';
    // Return focus to input
    userInput.focus();
});

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text && !currentImageBase64) return;

    const base64ImageToSend = currentImageBase64;
    const previewUrl = imagePreview.src;

    // Add user message to UI
    appendMessage(text, 'user', base64ImageToSend ? previewUrl : null);

    // Clear input fields and reset UI
    userInput.value = '';
    userInput.style.height = 'auto'; // reset textarea

    currentImageBase64 = null;
    imageUpload.value = '';
    imagePreviewContainer.style.display = 'none';
    imagePreview.src = '';
    userInput.focus();

    toggleLoading(true);

    const payload = {
        model: "gemma4:e4b",
        prompt: text,
        stream: true
    };

    if (base64ImageToSend) {
        payload.images = [base64ImageToSend];
    }

    // Create an empty bot message bubble to fill in real-time
    const botTextDiv = appendMessage("", 'bot');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let isFirstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                if (botTextDiv.actionContainer) {
                    botTextDiv.actionContainer.style.display = 'flex';
                }
                break;
            }

            if (isFirstChunk) {
                status.style.display = 'none'; // hide thinking dots once stream starts
                isFirstChunk = false;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        botTextDiv.rawText += json.response; // Update raw string
                        
                        // Render Markdown on the fly if loaded
                        if (typeof marked !== 'undefined') {
                            botTextDiv.innerHTML = marked.parse(botTextDiv.rawText);
                        } else {
                            botTextDiv.innerText = botTextDiv.rawText;
                        }

                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }
                } catch (e) {
                    // ignore partial JSON from stream chunking
                }
            }
        }
    } catch (error) {
        botTextDiv.innerText = "Error: Connection lost. Restart Colab.";
        console.error(error);
    } finally {
        toggleLoading(false);
    }
}

function appendMessage(text, sender, imageUrl = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        msgDiv.appendChild(img);
    }

    const textDiv = document.createElement('div');
    textDiv.className = 'markdown-body';
    
    // Store raw text for markdown & TTS
    textDiv.rawText = text || "";
    
    if (text) {
        if (sender === 'bot' && typeof marked !== 'undefined') {
            textDiv.innerHTML = marked.parse(text);
        } else {
            textDiv.style.whiteSpace = 'pre-wrap';
            textDiv.innerText = text;
        }
    } else {
        if (sender !== 'bot') {
            textDiv.style.whiteSpace = 'pre-wrap';
        }
    }
    
    msgDiv.appendChild(textDiv);

    // Provide Action Buttons only for bot replies
    if (sender === 'bot') {
        const actionContainer = document.createElement('div');
        actionContainer.className = 'bot-action-container';
        
        // Hide initially if this is an empty shell for a streaming response
        if (!text) {
            actionContainer.style.display = 'none';
        }
        
        // Attach to textDiv to allow toggling display later
        textDiv.actionContainer = actionContainer;

        // Copy Button
        const copyBtn = document.createElement('button');
        const copyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1"></path></svg>`;
        const copiedIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        
        copyBtn.innerHTML = `${copyIcon} <span>Copy</span>`;
        copyBtn.className = 'bot-action-btn';
        copyBtn.title = "Copy message";
        
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(textDiv.rawText);
            copyBtn.innerHTML = `${copiedIcon} <span>Copied!</span>`;
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = `${copyIcon} <span>Copy</span>`;
                copyBtn.classList.remove('copied');
            }, 2000);
        };
        actionContainer.appendChild(copyBtn);

        // TTS Button
        const ttsBtn = document.createElement('button');
        const playIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
        const stopIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        
        ttsBtn.innerHTML = `${playIcon} <span>Read Aloud</span>`;
        ttsBtn.className = 'bot-action-btn';
        ttsBtn.title = "Read message aloud";
        
        const resetBtnState = () => {
            ttsBtn.classList.remove('speaking');
            ttsBtn.innerHTML = `${playIcon} <span>Read Aloud</span>`;
        };

        ttsBtn.onclick = () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
                resetBtnState();
            } else {
                // Synthesize from rawText so HTML tags aren't read out
                const utterance = new SpeechSynthesisUtterance(textDiv.rawText);
                const voices = speechSynthesis.getVoices();
                const englishVoice = voices.find(v => v.lang.startsWith('en-') && !v.localService);
                if(englishVoice) utterance.voice = englishVoice;
                
                utterance.onstart = () => {
                    ttsBtn.classList.add('speaking');
                    ttsBtn.innerHTML = `${stopIcon} <span>Stop</span>`;
                };
                utterance.onend = resetBtnState;
                utterance.onerror = resetBtnState;
                
                speechSynthesis.speak(utterance);
            }
        };
        actionContainer.appendChild(ttsBtn);
        msgDiv.appendChild(actionContainer);
    }

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return textDiv;
}

function toggleLoading(isLoading) {
    sendBtn.disabled = isLoading;
    status.style.display = isLoading ? 'flex' : 'none';
}

sendBtn.addEventListener('click', sendMessage);
