import fastify from "fastify";
import coockie from "@fastify/cookie";
import websocket from "@fastify/websocket";
import { createPoll } from "../routes/create-poll";
import { getPoll } from "../routes/get-poll";
import { voteOnPoll } from "../routes/vote-on-poll";
import { pollResults } from "./ws/poll-result";

const app = fastify();

app.register(coockie, {
  secret: "polls-app",
  hook: "onRequest",
});

app.register(websocket);

app.register(createPoll);
app.register(getPoll);
app.register(voteOnPoll);
app.register(pollResults);

app.listen({ port: 3333 }).then(() => {
  console.log("http server running");
});
