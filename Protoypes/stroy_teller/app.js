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
    start: new TreeNode("Once upon a time, in a faraway land, there was a brave knight named Sir Lancelot. Sir Lancelot was on a quest to find the legendary sword Excalibur. As he ventured through the enchanted forest, he encountered a wise old wizard who offered him guidance. The wizard told him that Excalibur was hidden in a mystical lake guarded by a fearsome dragon. Will Sir Lancelot continue his quest to find Excalibur?", 'continueQuest', 'endRejected'),
    continueQuest: new TreeNode("Sir Lancelot accepted the wizard's guidance. Will he enter the enchanted forest?", 'enterForest', 'notEnterForest'),
    enterForest: new TreeNode("Sir Lancelot enters the enchanted forest. Will he confront the fearsome dragon?", 'confrontDragon', 'notConfrontDragon'),
    notEnterForest: new TreeNode("Sir Lancelot decides not to enter the forest. The end."),
    endRejected: new TreeNode("Sir Lancelot rejected the wizard's guidance. The end."),
    notConfrontDragon: new TreeNode("Sir Lancelot chooses not to confront the dragon. The end."),
    confrontDragon: new TreeNode("Sir Lancelot confronts the fearsome dragon. Will he succeed in retrieving Excalibur?", 'retrieveExcalibur', 'failRetrieveExcalibur'),
    retrieveExcalibur: new TreeNode("Sir Lancelot successfully retrieves Excalibur. The end."),
    failRetrieveExcalibur: new TreeNode("Sir Lancelot fails to retrieve Excalibur. The end."),
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