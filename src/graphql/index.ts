import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers } from "./course.resolver";
import { readFileSync } from "fs";
import { join } from "path";

const typeDefs = readFileSync(join(__dirname, "./course.schema.graphql"), "utf8");

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
