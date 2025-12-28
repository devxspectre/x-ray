
const text1 = `The agent scheduled a meeting with the design team for next Tuesday at 2:00 PM.

REASON: 
The action taken by the agent was to create a calendar event...`;

const text2 = `Some summary.
REASON: Because.`;

const text3 = `Summary.
**REASON:** Because.`;

const regex = /(?:^|\n)REASON[:\s]+([\s\S]*?)$/i;

function test(t) {
    const match = t.match(regex);
    console.log('---');
    if (match) {
        console.log('MATCH FOUND');
        console.log('Captured:', match[1].substring(0, 20) + '...');
        const clean = t.replace(regex, '').trim();
        console.log('Clean:', clean);
    } else {
        console.log('NO MATCH');
    }
}

test(text1);
test(text2);
test(text3);
