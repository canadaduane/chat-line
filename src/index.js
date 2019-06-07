import Path from "path";
import Debug from "debug";
import { Repo } from "hypermerge";
import storage from "random-access-file";
const discoverySwarm = require("discovery-swarm");
const swarmDefaults = require("dat-swarm-defaults");
// import DiscoverySwarm from "discovery-cloud-client";
// const discoveryUrl = "wss://discovery-cloud.herokuapp.com";

const log = Debug("chat");

const docUri = "hypermerge:/8NNovZ6CsgQh3HUbSBT56q3Eu3ov9SMptC4jyVeDR1qy"; // chat thread
log("docUri", docUri);

const path =
  process.env["DATADIR"] || Path.join(process.env["HOME"], ".hypermerge-chat");
log("hypermerge storage path", path);

process.on("SIGINT", function() {
  console.log("SIGINT", process.pid);
  process.exit();
});

const repo = new Repo({ storage, path, port: 0 });
// const swarm = new DiscoverySwarm({
//   url: discoveryUrl,
//   id: repo.back.id,
//   stream: repo.back.stream
// });
const swarm = discoverySwarm(
  swarmDefaults({
    port: 0,
    hash: false,
    encrypt: true,
    stream: repo.stream,
    id: repo.id
  })
);
repo.replicate(swarm);
repo.watch(docUri, msg => log("msg", msg));
