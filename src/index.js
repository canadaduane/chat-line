import { Repo } from "hypermerge";
import Automerge from "automerge";
import storage from "random-access-memory";
import DiscoverySwarm from "discovery-cloud-client";
import uuid from "uuid";

import NeatInput from "neat-input";
import DiffStream from "ansi-diff-stream";
import ansi from "ansi-styles";

const me = uuid();
const discoveryUrl = "wss://discovery-cloud.herokuapp.com";

const repo = new Repo({ storage, port: 0 });
const input = NeatInput({
  style: (start, cursor, end) =>
    start + ansi.inverse.open + (cursor || " ") + ansi.inverse.close + end
});
const differ = DiffStream();

let handle;
let docUri;
let document = {};
let stateCount = 0;

// Set up the ANSI neat-input command line interface
const render = () => {
  // Make it easy to see if the URI is same / different between terminals
  const hue = Buffer.from(docUri).reduce((total, k) => total + k) % 256;
  const uriColor = ansi.bgColor.ansi256.hsl(hue, 80, 70);
  const begin = `${uriColor}${ansi.color.black.open}`;
  const end = `${ansi.color.close}${ansi.bgColor.close}`;

  differ.write(`
---------------------------------------------------------------
 It's a mini collaborative text chat!
---------------------------------------------------------------

${input.line()}
 
---------------------------------------------------------------
 URI: ${begin}${docUri}${end}
 (paste or type this into the other chat-line)
---------------------------------------------------------------

Cursor: ${input.cursor}  Transitions: ${stateCount}
My UUID: ${me}

Shared State:
${JSON.stringify(document, null, 2)}
`);
};

const openUri = _docUri => {
  if (handle) handle.close();
  handle = repo.open(_docUri);
  docUri = _docUri;
  handle.subscribe(newDoc => {
    document = newDoc;
    input.setRaw(document.text.join(""));
    stateCount++;
    render();
  });
  handle.change(doc => {
    doc.collaborators[me] = true;
  });
};

differ.pipe(process.stdout);

input.on("insertChar", (ch, cursor) => {
  // console.log("insertChar", cursor, input.cursor, ch.length);
  handle.change(doc => {
    doc.text.insertAt(cursor, ch);
  });
});

input.on("backspace", (ch, origCursor, newCursor) => {
  const removedLength = origCursor - newCursor;
  handle.change(doc => {
    // log("removedLength", removedLength, origCursor, newCursor);
    if (removedLength > 0) {
      doc.text.splice(newCursor, removedLength);
    }
  });
});

input.on("enter", line => {
  handle.change(doc => {
    doc.text.splice(0, doc.text.length);
  });
});

input.on("left", render);
input.on("right", render);

input.on("update", () => {
  const newText = input.rawLine();
  const match = newText.match(/^hypermerge:\/([0-9A-Za-z]{44,44})$/);
  if (match) {
    openUri(newText);
    input.set("");
  }
});

// Set up the Hypermerge documents
const swarm = new DiscoverySwarm({
  url: discoveryUrl,
  id: repo.back.id,
  stream: repo.back.stream
});

repo.replicate(swarm);
const text = new Automerge.Text();
openUri(repo.create({ text, collaborators: {} }));

// Kick off first render
render();
