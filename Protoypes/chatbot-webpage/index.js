const express = require('express');
const bodyParser = require('body-parser');
const { PythonShell } = require('python-shell');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve HTML and JS for the webpage

app.post('/chat', (req, res) => {
    let userMessage = req.body.message;
    let pyOptions = {
        mode: 'text',
        pythonOptions: ['-u'], // Unbuffered output
        scriptPath: './', // Path where your Python script is located
    };

    PythonShell.run('main.py', pyOptions, { args: [userMessage] }, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error while communicating with the chatbot.');
        } else {
            let pythonResponse = JSON.parse(results[0]);
            console.log(JSON.parse(results[0]))
            res.send(pythonResponse);
        }
    });
});

app.listen(port, () => {
    console.log(`Chatbot server listening at http://localhost:${port}`);
});