const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const OPENAI_API_KEY = "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";
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve HTML and JS for the webpage

let thread

app.post('/chat', async (req, res) => {
    let userMessage = req.body.message;

    // Your custom logic goes here.

    const userMessageResponse = await client.beta.threads.messages.create(
        thread.id,
        { role: "user", content: userMessage }
    );

    const run = await client.beta.threads.runs.create(
        thread.id,
        { assistant_id: "asst_KaRiEThA1tePbFVurmRmRNeK", instructions: "Talk to the users" }
    );

    while (true) {
        const runResponse = await client.beta.threads.runs.retrieve(thread.id, run.id);

        console.log("Run status:", runResponse.status);
        if (runResponse.status === 'completed') {
            break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const responseMessages = await client.beta.threads.messages.list(thread.id);
    const assistResponse = responseMessages.data[0].content[0].text.value;
    // Implement your custom logic here.
    // TODO: Process the userMessage and populate the responseMessage.

    // Send the response back to the client.
    res.json({ message: assistResponse });
});

app.listen(port, async () => {
    thread = await client.beta.threads.create();
    console.log(`Chatbot server listening at http://localhost:${port}`);
    console.log(thread.id)
});
