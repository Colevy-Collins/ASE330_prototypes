const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const OPENAI_API_KEY = "";
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

let thread
let selectedOptions = {};
let answersList = []; // Initialize the list with the start node
let isTraverseStoryRunning = false;
let isCreatingAI = false;
let assistant_id = "asst_AmjQ55bLUIHbDS8BVV7zjedd";

async function traverseStory(answer) {

    if (isTraverseStoryRunning) {
        console.log("traverseStory is already running...");
        return; // If traverseStory is running, we simply return
    }

    isTraverseStoryRunning = true; // Set the flag to indicate traverseStory is running
    try {
        let userMessage = answer;

        const userMessageResponse = await client.beta.threads.messages.create(
            thread.id,
            { role: "user", content: userMessage }
        );
    
        const run = await client.beta.threads.runs.create(
            thread.id,
            { assistant_id: assistant_id}
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
    } catch (error) {
        console.error("An error occurred during traverseStory: ", error);
    } finally {
        isTraverseStoryRunning = false; // Reset the flag when done
    }
}

async function createAI() {

    if (isCreatingAI) {
        console.log("createAI is already running...");
        return; // If traverseStory is running, we simply return
    }

    isCreatingAI = true; // Set the flag to indicate traverseStory is running
    try {
        const assistant = await openai.beta.assistants.create({
            name: "Story Teller V2",
            instructions: `
            Pretend that you are game master and create a story using the following criteria:
            1. Begin the narrative with an introductory segment, providing background information and setting details.
            2. Present only one prompt and get user input before the next prompt. The story should build off of the users choices.
            3. Each prompt should offer only ${selectedOptions[0]} options for advancing the story.
            4. When presenting the options to the user you should prefix each option with "option" and a number that correspond with that option
            5. Craft the story around a journey involving decisions such as choosing paths, encountering characters, and engaging in combat.
            6. Develop combat sequences with multiple prompts, detailing each step and allowing the user to choose actions and employ strategic maneuvers.
            7. Ensure that each combat scenario has the potential to result in lasting effects, including the possibility of death. Give the user the status of their effects with each combat prompt 
            8. Introduce the element of chance for death in every prompt. Death of the user should be very possible throughout the story. The user should be able to die for being risky or choosing a path that leads to death.
            9. Make it clear that the story concludes if the user dies.
            10. The story plot should be based on a ${selectedOptions[2]}story.
            11. Conclude the narrative when the boss is successfully defeated.
            12. The story should be ${selectedOptions[1]}-themed
            13. combat should have great detail and abundant. 
            14. The user should be able to go back one prompt at a time to try the other option.
            15. provide output only in a json object with the attributes for the prompt which holds all the text of the story, each option and colors that has colors for html attributes. There should be 6 colors for the web page that are vibrant and ${selectedOptions[1]} themed. The json object should have a "prompt", "optionX" where X is the number for the option, "color1", "color1", "color2", "color3", "color4", "color5", "color6".
            16. Each prompt should contain rich details but is ${selectedOptions[3]} in length. 
            17. provide output only in a json object with the attributes for the prompt which holds all the text of the story, each option and colors that has colors for html attributes. There should be 6 colors for the web page that are vibrant and space themed. The json object should have a "prompt", "optionX" where X is the number for the option, "color1", "color1", "color2", "color3", "color4", "color5", "color6".
            `,
            model: "gpt-4-1106-preview",
          });

        assistant_id = assistant.id;

    } catch (error) {
        console.error("An error occurred during creatingAI: ", error);
    } finally {
        isCreatingAI = false; // Reset the flag when done
    }

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
    res.render('customize_story'); // Include answersList in the render context
});

app.post('/api/submit-form', async(req, res) => {
    // Extract selector values
    for (let i = 1; i <= 4; i++) {
        const selectorKey = `selector${i}`;
        if(req.body.hasOwnProperty(selectorKey)) {
            selectedOptions[selectorKey] = req.body[selectorKey];
        } else {
            // Handle the absence of expected key here
            console.log(`Missing selector: ${selectorKey}`);
        }
    }

    await createAI()
    thread = await client.beta.threads.create();
    await traverseStory("start the story");
    res.render('currentPrompt', { answersList }); // Ensure answersList is passed here
    

});

app.get('/answer/:answer', async (req, res) => {
    const answer = req.params.answer.toLowerCase();

    // Before calling traverseStory, you may want to validate the answer
    if (!isValidAnswer(answer)) {
        return res.status(400).json({ error: 'Invalid answer' });
    }

    try {
        // Call the asynchronous function to process the answer
        await traverseStory(answer);
        
        // Respond with JSON containing the updated answersList.
        // You might want to include other details as well if needed.
        res.json({ answersList });
    } catch (error) {
        // Handle any errors that might have occurred during processing
        console.error('Error processing answer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Helper function to validate the user's answer.
// You need to define what constitutes a valid answer in your case.
function isValidAnswer(answer) {
    // For demonstration purposes, let's assume the answer should be a digit.
    return /^\d+$/.test(answer);
}

app.get('/currentStoryStatus', (req, res) => {
    // Send whether the story is ready and, if so, the latest segment.
    res.json({
        storyReady: !isTraverseStoryRunning,
        latestStorySegment: answersList[answersList.length - 1] // Latest story segment.
    });
});

app.listen(3000, async () => {
    console.log('Server is running on port 3000');
});
