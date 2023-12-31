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
        const assistant = await client.beta.assistants.create({
            name: "Story Teller V2",
            instructions: `
            Pretend that you are game master and create a story using the following criteria:
            1. Begin the narrative with an introductory segment, providing background information and setting details.
            2. Present only one prompt and get user input before the next prompt. The story should build off of the users choices.
            3. Each prompt should offer only ${selectedOptions.selector1} options for advancing the story.
            4. When presenting the options to the user you should prefix each option with "option" and a number that correspond with that option
            5. Craft the story around a journey involving decisions such as choosing paths, encountering characters, and engaging in combat.
            6. Develop combat sequences with multiple prompts, detailing each step and allowing the user to choose actions and employ strategic maneuvers.
            7. Ensure that each combat scenario has the potential to result in lasting effects, including the possibility of death. Give the user the status of their effects with each combat prompt 
            8. Introduce the element of chance for death in every prompt. Death of the user should be very possible throughout the story. The user should be able to die for being risky or choosing a path that leads to death.
            9. Make it clear that the story concludes if the user dies.
            10. The story plot should be based on a ${selectedOptions.selector3}story.
            11. Conclude the narrative when the boss is successfully defeated.
            12. The story should be ${selectedOptions.selector2}-themed
            13. combat should have great detail and abundant. 
            14. The user should be able to go back one prompt at a time to try the other option.
            15. provide output only in a json object with the attributes for the prompt which holds all the text of the story, each option and colors that has colors for html attributes. There should be 6 colors for the web page that are vibrant and ${selectedOptions[1]} themed. The json object should have a "prompt", "optionX" where X is the number for the option, "color1", "color1", "color2", "color3", "color4", "color5", "color6".
            16. Each prompt should be ${selectedOptions.selector4}. 
            17. provide output only in a json object with the attributes for the prompt which holds all the text of the story, each option and colors that has colors for html attributes. There should be 6 colors for the web page that are vibrant and space themed. The json object should have a "prompt", "optionX" where X is the number for the option, "color1", "color1", "color2", "color3", "color4", "color5", "color6".
            18. when the sotry is over state to the user that the story has concluded.
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
    if (isTraverseStoryRunning == false) {
        goBack(); // Call goBack function to update currentNode and answersList
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

    // const temp = {1:`json { "prompt": "Engaging the Odyssey's advanced sensor array, you scrutinize the shifting patterns among the asteroids. The dynamic holographic display flickers with calculations as potential trajectories unfurl before you. Navigating this celestial labyrinth requires precision and a tactical approach. Each rock, varying from the size of a small shuttle to a sprawling metropolis, orbits in a dangerously unpredictable dance. The scanner locks onto a promising route, threading through the chaos with minimal risk but requiring a keen eye and steady hand at the helm.", "option1": "Take manual control and delicately pilot the Odyssey through the plotted path.", "option2": "Override the suggested route and create your own path, using the asteroid's gravity to slingshot the ship forward.", "option3": "Engage the automatic pilot to follow the plotted course, allowing you to prepare for any unforeseen encounters.", "option4": "Hesitate and reconsider your approach. Perhaps there's wisdom in seeking additional support at 'The Haven'.", "color1": "#2E82FF", "color2": "#F04E98", "color3": "#1BBF72", "color4": "#F5D300", "color5": "#9D00FF", "color6": "#FF6F61" }`}
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
    res.writeHead(301, {
        Location: `http://localhost:3000/currentPrompt?`
    }).end()
    res.render('currentPrompt', { answersList }); // Ensure answersList is passed here
    // res.render('currentPrompt', { temp }); // Ensure answersList is passed here


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

app.get('/answerlist', async (req, res) => {
    res.json({ answersList });
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