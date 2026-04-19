# 🤖 Incognito Gemma 

Welcome to **Incognito Gemma**, a sleek, ultra-premium local deployment of the Gemma 4 Language Model! 

Ever wanted a chatbot that feels like it’s chatting with you from a hyper-futuristic rainy high-rise? You found it. This isn't just another ChatGPT wrapper; this is a hand-crafted, glassmorphism-infused, visually stunning local AI companion. Oh, and it supports multimodal image uploads and real-time streaming right out of the box! 🚀

## 🌟 Quirky Features
- **True Incognito Mode**: It's called Incognito for a reason! It doesn't store, save, or keep any history of your chats. Once you close the tab, your tracks vanish into cyberspace.
- **Mind-Reading AI**: Okay, not really, but Gemma 4 is incredibly smart and fast!
- **Astonishing UI**: Built with pure Vanilla CSS, featuring animated neon bokeh lights and a frosted glass aesthetic that would make a cyberpunk hacker jealous.
- **Real-Time Word vomit**: Generates responses word-by-word just like the big boys, so you don't have to wait an eternity for a reply.
- **Multimodal Mayhem**: Upload images directly into the chat and let Gemma analyze them.

## 🧠 Architecture
While this sleek UI runs entirely locally in your browser, the heavy lifting is done remotely. To keep things lightweight and accessible, the **Gemma 4 model is hosted on a Google Colab notebook**, utilizing their cloud GPUs for inference. We then use an **ngrok** tunnel to securely stream data between the Colab backend and this local front-end.

## 🛠️ How to run
1. Spin up the Gemma 4 Model on your **Google Colab** notebook and initialize the **ngrok** tunnel. 
2. Copy the newly generated ngrok URL and paste it into the `API_URL` variable inside `script.js`.
3. Simply double-click and open `index.html` in your browser. No build steps. No `node_modules` black hole. Just pure web magic.

---
*Created with ❤️ by **Astonishing Geeks*** 
*"Because normal chatbots are boring."*
