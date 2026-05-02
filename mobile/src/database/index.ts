import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { appSchema } from "@nozbe/watermelondb";

const schema = appSchema({
  version: 1,
  tables: [],
});

const adapter = new SQLiteAdapter({
  dbName: "poultrytrack",
  schema,
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [],
});
