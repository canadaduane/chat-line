import { Repo } from "hypermerge";
import Automerge from "automerge";
import storage from "random-access-memory";
import DiscoverySwarm from "discovery-cloud-client";

import NeatInput from "neat-input";
import DiffStream from "ansi-diff-stream";
import ansi from "ansi-styles";

const discoveryUrl = "wss://discovery-cloud.herokuapp.com";

const repo = new Repo({ storage, port: 0 });
const input = NeatInput({
  style: (start, cursor, end) =>
    start + ansi.inverse.open + (cursor || " ") + ansi.inverse.close + end
});
const differ = DiffStream();

let docUri;
let document = {};

// Set up the ANSI neat-input command line interface
const render = () => {
  // Make it easier to see if the docUri is the same or different across terminals
  const hue = Buffer.from(docUri).reduce((total, k) => total + k) % 256;
  const uriColor = ansi.bgColor.ansi256.hsl(hue, 80, 70);
  const begin = `${uriColor}${ansi.color.black.open}`;
  const end = `${ansi.color.close}${ansi.bgColor.close}`;

  differ.write(`
---------------------------------------------------------------
 It's a mini collaborative text editor!
---------------------------------------------------------------

${input.line()}
 
---------------------------------------------------------------
 URI: ${begin}${docUri}${end}
 (paste this into the other editor)
---------------------------------------------------------------

Document State:
${JSON.stringify(document, null, 2)}
`);
};

const openUri = _docUri => {
  docUri = _docUri;
  // repo.open(docUri);
  repo.watch(docUri, newState => {
    const oldCursor = input.cursor;
    document = newState;
    console.log(
      "newState",
      newState.text,
      newState.text instanceof Automerge.Text,
      newState.text.constructor.name
    );
    input.set(newState.text.join(""));
    input.cursor = oldCursor;
    render();
  });
};

differ.pipe(process.stdout);

input.on("insertChar", (cursor, ch) => {
  repo.change(docUri, doc => {
    doc.text.insertAt(cursor, ch);
  });
});

input.on("update", () => {
  const newText = input.rawLine();
  console.log("newText", newText);
  const match = newText.match(/^hypermerge:\/([0-9A-Za-z]{44,44})$/);
  if (match) {
    openUri(newText);
    input.set("");
  }
  render();
});

// Set up the Hypermerge documents
const swarm = new DiscoverySwarm({
  url: discoveryUrl,
  id: repo.back.id,
  stream: repo.back.stream
});

repo.replicate(swarm);
openUri(repo.create({ text: new Automerge.Text() }));

// Kick off first render
render();
