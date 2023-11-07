const express = require('express');
const ejs = require('ejs');
const { OpenAI } = require('openai');
const openai_key = require('/openaiApiKey.js')

const app = express();
const port = 3000;

// Initialize OpenAI with your API key
const OPENAI_API_KEY = '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';
const openai = new OpenAI({apiKey: OPENAI_API_KEY});

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to parse the request body
app.use(express.urlencoded({ extended: true }));

// Serving the home page
app.get('/', (req, res) => {
    res.render('index');
});

// Gather user input from the home page
app.post('/gather-input', async (req, res) => {
    const userInput = req.body.userInput;
    console.log(userInput)
    try {
        const response = await openai.chat.completions.create({
            model : "gpt-3.5-turbo",
            messages : [
              {"role": "user", "content": "${userIput}"},
            ]
    });
        const responseData = response.completion.choices[0].message.content;
        res.send(responseData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
