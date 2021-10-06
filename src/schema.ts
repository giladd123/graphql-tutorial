import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLContext } from "./context";
import typeDefs from "./schema.graphql";
import { Link, User, Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { APP_SECRET } from "./auth";
import { sign } from "jsonwebtoken";
import { PubSubChannels } from "./pubsub";
import { Resolvers } from "./generated/graphql";
const resolver2: Resolvers = {
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (parent, args, context) => {
      const where = args.filter
        ? {
            OR: [
              { description: { contains: args.filter } },
              { url: { contains: args.filter } },
            ],
          }
        : {};
      const totalCount = await context.prisma.link.count({ where });
      const links = await context.prisma.link.findMany({
        where,
        skip: args.skip,
        take: args.take,
        orderBy: args.orderBy,
      });
      return { count: totalCount, links };
    },
  },
  Mutation: {
    post: async (parent, args, context) => {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      const newLink = await context.prisma.link.create({
        data: {
          url: args.url,
          description: args.description,
          postedBy: { connect: { id: context.currentUser.id } },
        },
      });
      context.pubSub.publish("newLink", { createdLink: newLink });
      return newLink;
    },
    vote: async (parent, args, context) => {
      if (!context.currentUser) {
        throw new Error("You must login in order to use upvote!");
      }
      const userId = context.currentUser.id;
      const vote = await context.prisma.vote.findUnique({
        where: {
          linkId_userId: {
            linkId: Number(args.linkId),
            userId: userId,
          },
        },
      });
      if (vote !== null) {
        throw new Error(`Already voted for link: ${args.linkId}`);
      }
      const newVote = await context.prisma.vote.create({
        data: {
          user: { connect: { id: userId } },
          link: { connect: { id: Number(args.linkId) } },
        },
      });
      context.pubSub.publish("newVote", { createdVote: newVote });
      return newVote;
    },
    signup: async (
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext
    ) => {
      const password = await hash(args.password, 10);
      const user = await context.prisma.user.create({
        data: { ...args, password },
      });
      const token = sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },
    login: async (
      parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new Error("NO such user found");
      }
      const valid = await compare(args.password, user.password);
      if (!valid) {
        throw new Error("Invalid password");
      }
      const token = sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },
  },
  Subscription: {
    newLink: {
      subscribe: (parent: unknown, args: {}, context: GraphQLContext) => {
        return context.pubSub.asyncIterator("newLink");
      },
      resolve: (payload: PubSubChannels["newLink"][0]) => {
        return payload.createdLink;
      },
    },
    newVote: {
      subscribe: (parent: unknown, args: {}, context: GraphQLContext) => {
        return context.pubSub.asyncIterator("newVote");
      },
      resolve: (payload: PubSubChannels["newVote"][0]) => {
        return payload.createdVote;
      },
    },
  },
  Vote: {
    link: (parent, args, context) =>
      context.prisma.vote.findUnique({ where: { id: parent.id } }).link(),
    user: (parent, args, context) =>
      context.prisma.vote.findUnique({ where: { id: parent.id } }).user(),
  },
  Link: {
    votes: (parent, args, context) =>
      context.prisma.link.findUnique({ where: { id: parent.id } }).votes(),
    id: (parent) => parent.id.toString(),
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    postedBy: async (parent, args, context) => {
      if (!parent.postedById) {
        return null;
      }

      return context.prisma.link
        .findUnique({ where: { id: parent.id } })
        .postedBy();
    },
  },
  User: {
    links: (parent, args, context) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).links(),
  },
};
const resolvers = {
  Vote: {
    link: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.vote.findUnique({ where: { id: parent.id } }).link(),
    user: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.vote.findUnique({ where: { id: parent.id } }).user(),
  },
  Query: {
    info: () => `This is the API of a Hackernews Clone`,
    feed: async (
      parent: unknown,
      args: {
        filter?: string;
        skip?: number;
        take?: number;
        orderBy?: {
          description?: Prisma.SortOrder;
          url?: Prisma.SortOrder;
          createdAt?: Prisma.SortOrder;
        };
      },
      context: GraphQLContext
    ) => {
      const where = args.filter
        ? {
            OR: [
              { description: { contains: args.filter } },
              { url: { contains: args.filter } },
            ],
          }
        : {};
      const totalCount = await context.prisma.link.count({ where });
      const links = await context.prisma.link.findMany({
        where,
        skip: args.skip,
        take: args.take,
        orderBy: args.orderBy,
      });
      return { count: totalCount, links };
    },
    me: (parent: unknown, args: {}, context: GraphQLContext) => {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      return context.currentUser;
    },
  },
  User: {
    links: (parent: User, args: {}, context: GraphQLContext) =>
      context.prisma.user.findUnique({ where: { id: parent.id } }).links(),
  },
  Link: {
    votes: (parent: Link, args: {}, context: GraphQLContext) =>
      context.prisma.link.findUnique({ where: { id: parent.id } }).votes(),
    id: (parent: Link) => parent.id,
    description: (parent: Link) => parent.description,
    url: (parent: Link) => parent.url,
    postedBy: async (parent: Link, args: {}, context: GraphQLContext) => {
      if (!parent.postedById) {
        return null;
      }

      return context.prisma.link
        .findUnique({ where: { id: parent.id } })
        .postedBy();
    },
  },
  Mutation: {
    vote: async (
      parent: unknown,
      args: { linkId: string },
      context: GraphQLContext
    ) => {
      if (!context.currentUser) {
        throw new Error("You must login in order to use upvote!");
      }
      const userId = context.currentUser.id;
      const vote = await context.prisma.vote.findUnique({
        where: {
          linkId_userId: {
            linkId: Number(args.linkId),
            userId: userId,
          },
        },
      });
      if (vote !== null) {
        throw new Error(`Already voted for link: ${args.linkId}`);
      }
      const newVote = await context.prisma.vote.create({
        data: {
          user: { connect: { id: userId } },
          link: { connect: { id: Number(args.linkId) } },
        },
      });
      context.pubSub.publish("newVote", { createdVote: newVote });
      return newVote;
    },
    signup: async (
      parent: unknown,
      args: { email: string; password: string; name: string },
      context: GraphQLContext
    ) => {
      const password = await hash(args.password, 10);
      const user = await context.prisma.user.create({
        data: { ...args, password },
      });
      const token = sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },
    post: async (
      parent: unknown,
      args: { url: string; description: string },
      context: GraphQLContext
    ) => {
      if (context.currentUser === null) {
        throw new Error("Unauthenticated!");
      }

      const newLink = await context.prisma.link.create({
        data: {
          url: args.url,
          description: args.description,
          postedBy: { connect: { id: context.currentUser.id } },
        },
      });
      context.pubSub.publish("newLink", { createdLink: newLink });
      return newLink;
    },
    login: async (
      parent: unknown,
      args: { email: string; password: string },
      context: GraphQLContext
    ) => {
      const user = await context.prisma.user.findUnique({
        where: { email: args.email },
      });
      if (!user) {
        throw new Error("NO such user found");
      }
      const valid = await compare(args.password, user.password);
      if (!valid) {
        throw new Error("Invalid password");
      }
      const token = sign({ userId: user.id }, APP_SECRET);
      return { token, user };
    },
  },
  Subscription: {
    newLink: {
      subscribe: (parent: unknown, args: {}, context: GraphQLContext) => {
        return context.pubSub.asyncIterator("newLink");
      },
      resolve: (payload: PubSubChannels["newLink"][0]) => {
        return payload.createdLink;
      },
    },
    newVote: {
      subscribe: (parent: unknown, args: {}, context: GraphQLContext) => {
        return context.pubSub.asyncIterator("newVote");
      },
      resolve: (payload: PubSubChannels["newVote"][0]) => {
        return payload.createdVote;
      },
    },
  },
};
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
