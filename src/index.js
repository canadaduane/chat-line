import { Repo } from "hypermerge";
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
let collabText = "";

// Set up the ANSI neat-input command line interface
const render = () => {
  differ.write(`
  ---------------------------------------------------------------
   It's a mini collaborative text editor!
  ---------------------------------------------------------------
  ${input.line()}
  ---------------------------------------------------------------
   URI: ${docUri}
   (paste this into the other editor)
  ---------------------------------------------------------------
  `);
};

const openUri = _docUri => {
  docUri = _docUri;
  // repo.open(docUri);
  repo.watch(docUri, newState => {
    const oldCursor = input.cursor;
    input.set(newState.text);
    input.cursor = oldCursor;
    render();
  });
};

differ.pipe(process.stdout);

input.on("update", () => {
  const newText = input.rawLine();
  const match = newText.match(/^hypermerge:\/([0-9A-Za-z]{44,44})$/);
  if (match) {
    openUri(newText);
    input.set("");
  } else {
    repo.change(docUri, doc => {
      doc.text = newText;
    });
  }
  // const pos = input.cursor;
  render();
});

// Set up the Hypermerge documents
const swarm = new DiscoverySwarm({
  url: discoveryUrl,
  id: repo.back.id,
  stream: repo.back.stream
});

repo.replicate(swarm);
openUri(repo.create({ text: "" }));

// Kick off first render
render();
