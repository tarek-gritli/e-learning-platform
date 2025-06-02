// src/graphql-server.ts
import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { schema } from "./graphql/index";

const yoga = createYoga({ schema });
const server = createServer(yoga);

server.listen(4000, () => {
  console.log("GraphQL server running at http://localhost:4000/graphql");
});
