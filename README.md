# Chat Line

A collaborative chat experience on the command-line.

![Screenshot of chat-line](./screenshot1.png)

Once both terminals have synced on the same Hypermerge URI, collaborative chat ensues:

![Screenshot of chat-line](./screenshot2.png)

## How to Run

Download & run:

```
yarn install
yarn start
```

## What is Hypermerge?

[Hypermerge]() is the networking layer between a user's local changes (like [neat-input](https://github.com/mafintosh/neat-input) in this case) and [Automerge](https://github.com/automerge/automerge). It makes it easy to use [CRDTs](https://arxiv.org/abs/1608.03960) in an application, so that collaborative operations are guaranteed to converge on a single state shared among viewers.

## Thanks

Thanks to @pvh and others on the hypermerge/automerge team for help with issues & teaching me how this all works.

