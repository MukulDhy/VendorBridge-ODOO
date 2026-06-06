import { createUsersTable } from "../models/pgSql/user.model.js";


export async function initDatabase(pool) {
 await createUsersTable(pool);
}