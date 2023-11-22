const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const OPENAI_API_KEY = "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";
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

let thread

let answersList = []; // Initialize the list with the start node

async function traverseStory(answer) {

    let userMessage = answer;

    // Your custom logic goes here.

    const userMessageResponse = await client.beta.threads.messages.create(
        thread.id,
        { role: "user", content: userMessage }
    );

    const run = await client.beta.threads.runs.create(
        thread.id,
        { assistant_id: "asst_AmjQ55bLUIHbDS8BVV7zjedd"}
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

    answersList.push(assistResponse); // Add the current node to the list
}

// New function to go back to the previous prompt
async function goBack() {
    if (answersList.length > 1) {
        answersList.pop(); // Remove last choice
        await traverseStory("go back to the previous prompt");// Set current node to previous
    }
}

// And update the back button routes:
app.get('/back', (req, res) => {
    goBack(); // Call goBack function to update currentNode and answersList
    if (req.query.view === 'fullHistory') {
        res.render('fullHistory', { answersList });
    } else {
        res.render('currentPrompt', { answersList });
    }
});

// New route to show the full history view
app.get('/fullHistory', (req, res) => {
    res.render('fullHistory', { answersList });
});

app.get('/currentPrompt', (req, res) => {
    res.render('currentPrompt', { answersList });
});

app.get('/', (req, res) => {
    res.render('currentPrompt', { answersList }); // Include answersList in the render context
});

app.get('/answer/:answer',async (req, res) => {
    const answer = req.params.answer.toLowerCase();
    if (answer === '1' || answer === '2') {
        await traverseStory(answer);
        res.render('currentPrompt', { answersList }); // Ensure answersList is passed here
    } else {
        res.send('Invalid answer. Please select either "yes" or "no".');
    }
});

app.listen(3000, async () => {
    thread = await client.beta.threads.create();
    await traverseStory("start the story");
    console.log('Server is running on port 3000');
});
