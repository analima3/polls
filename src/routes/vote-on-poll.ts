import { z } from "zod";
import { prisma } from "../lib/prisma";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { redis } from "../lib/redis";

export async function voteOnPoll(app: FastifyInstance) {
  app.post("/poll/:pollId/vote", async (request, reply) => {
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(),
    });

    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    });

    const { pollOptionId } = voteOnPollBody.parse(request.body);
    const { pollId } = voteOnPollParams.parse(request.params);

    let { sessionId } = request.cookies;

    if (sessionId) {
      const userPreviewsVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          },
        },
      });

      if (
        userPreviewsVoteOnPoll &&
        userPreviewsVoteOnPoll.pollOptionId !== pollOptionId
      ) {
        await prisma.vote.delete({
          where: {
            id: userPreviewsVoteOnPoll.id,
          },
        });

        await redis.zincrby(pollId, -1, userPreviewsVoteOnPoll.pollOptionId);
      } else if (userPreviewsVoteOnPoll) {
        return reply
          .status(400)
          .send({ message: "You already votes on this poll." });
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 2592000, // 30 days in seconds
        signed: true,
        httpOnly: true,
      });
    }

    await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      },
    });

    await redis.zincrby(pollId, 1, pollOptionId);

    return reply.status(201).send();
  });
}
