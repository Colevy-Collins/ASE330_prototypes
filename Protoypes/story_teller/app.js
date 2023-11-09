const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

class TreeNode {
    constructor(question, yesNode = null, noNode = null) {
        this.question = question;
        this.yesNode = yesNode;
        this.noNode = noNode;
    }
}

const storyNodes = {
    start: new TreeNode("In a land of legends, you, Sir Lancelot, the valiant knight, awaken from a dream in your chamber. \n The soft morning light filters through stained glass windows, casting kaleidoscopic patterns on your chamber walls. You feel a stirring within, a calling to your quest - the search for the mythical Excalibur. Your journey begins in your room. The wise old wizard's prophecy lingers in your mind: Excalibur lies hidden in a mystical lake guarded by a dragon of immense power. Do you, Sir Lancelot, heed the call and continue your quest to find Excalibur?", 'continueQuest', 'endRejected'),

    continueQuest: new TreeNode("You, Sir Lancelot, accept the wizard's guidance and resolve to continue your noble quest. With armor donned and sword in hand, you step into the world beyond your chamber, where adventure and danger await. The path unfolds before you like an untold story. Will you venture into the forest, where ancient secrets lie?", 'enterForest', 'endRejected'),
    
    endRejected: new TreeNode("You, Sir Lancelot, reject the wizard's guidance and choose to remain in your chamber. The dream of Excalibur fades away, and the world remains untouched by your valor. The End."),
    
    enterForest: new TreeNode("Sir Lancelot enters the enchanted forest. The air is filled with the scent of wildflowers, and you feel a sense of anticipation. While wandering, you come across a hidden cache. Among the items, you find a beautifully crafted bow with a quiver of arrows. Will you pick up the bow and prepare for what lies ahead?", 'pickUpBow', 'leaveBowBehind'),

    pickUpBow: new TreeNode("With the bow in your hands, you continue your journey through the forest. As you venture deeper, the air grows thick with tension. The source of it all becomes clear as you stumble upon the mighty dragon, its scales glistening in the dappled sunlight. Do you take aim with your bow and shoot at the dragon, hoping to claim Excalibur?", "shootDragon", "notShootDragon"),

    shootDragon: new TreeNode("Sir Lancelot draws his bowstring, and with a steady hand, he releases an arrow towards the dragon. The arrow misses the mark, and the dragon lets out a thunderous roar. Do you try again and shoot at the dragon?", 'shootAgain', 'notShootAgain'),
    
    shootAgain: new TreeNode("With unwavering determination, Sir Lancelot notches another arrow and lets it fly. This time, the arrow finds its mark, striking the dragon. It roars in agony. Excalibur is now within sight. Will Sir Lancelot succeed in retrieving the legendary sword?", 'retrieveExcalibur', 'notReceiveExcalibur'),

    notShootAgain: new TreeNode("Sir Lancelot decides not to shoot another arrow at the dragon, choosing another path. As you hesitate, the dragon spots you and approaches. Do you attempt to run past the dragon?", 'runPast', 'notRunPast'),

    notShootDragon: new TreeNode("Sir Lancelot decides not to shoot another arrow at the dragon, choosing another path. As you turn away, the dragon pounces and devours you."),

    notReceiveExcalibur: new TreeNode("Despite the dragon's injury, Sir Lancelot is unable to secure Excalibur. The quest remains unfulfilled."),

    leaveBowBehind: new TreeNode("You choose not to pick up the bow and leave it behind. As you proceed deeper into the forest, you realize you have no weapon. The tension in the air grows, and you feel vulnerable. Do you continue deeper into the forest?", 'continueForest', 'notContinueForest'),

    notContinueForest: new TreeNode("Sir Lancelot decides not to continue deeper into the forest. He turns back, feeling uncertain about the journey."),

    continueForest: new TreeNode("Despite the lack of a weapon, Sir Lancelot pushes forward through the forest. Your heart races as you come face to face with the dragon, its gaze locked on you. In a desperate moment, you find a large rock nearby. Do you throw the rock to distract the dragon?", 'throwRock', 'notThrowRock'),

    throwRock: new TreeNode("Sir Lancelot hurls the rock with precision, and it creates a loud thud, distracting the dragon momentarily. The path to Excalibur is now visible. Will Sir Lancelot succeed in retrieving the legendary sword?", 'retrieveExcalibur', 'failReceiveExcalibur'),

    notThrowRock: new TreeNode("Sir Lancelot decides not to distract the dragon and considers other options. As you hesitate, the dragon spots you and approaches. Do you attempt to run past the dragon?", 'runPast', 'notRunPast'),

    runPast: new TreeNode("With a burst of speed, Sir Lancelot sprints past the dragon, narrowly escaping its jaws. Excalibur awaits you just ahead. Will you succeed in retrieving the legendary sword?", 'retrieveExcalibur', 'failReceiveExcalibur'),

    notRunPast: new TreeNode("You choose not to distract or run past the dragon. Trapped and defenseless, there's no escape."),

    retrieveExcalibur: new TreeNode("With determination and bravery, Sir Lancelot retrieves Excalibur from its hidden place. The sword gleams with a legendary power, and you are hailed as a hero."),

    failReceiveExcalibur: new TreeNode("Despite your efforts, Excalibur remains elusive. The quest ends in uncertainty.")
};


let currentNode = 'start';

function traverseStory(answer) {
    if (answer === 'yes' && storyNodes[currentNode].yesNode) {
        currentNode = storyNodes[currentNode].yesNode;
    } else if (answer === 'no' && storyNodes[currentNode].noNode) {
        currentNode = storyNodes[currentNode].noNode;
    }
}

app.get('/', (req, res) => {
    res.render('index', { question: storyNodes[currentNode].question, storyNodes, currentNode });
});

app.get('/answer/:answer', (req, res) => {
    const answer = req.params.answer.toLowerCase();
    if (answer === 'yes' || answer === 'no') {
        traverseStory(answer);
        res.render('index', { question: storyNodes[currentNode].question, storyNodes, currentNode });
    } else {
        res.send('Invalid answer. Please select either "yes" or "no".');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
