import { initializeDatabase } from "../database/initialize.mjs";
import { DatabaseConfigurationError, openTursoClient } from "../server/database.mjs";

let client;
try {
  client = openTursoClient();
  await initializeDatabase(client);
  console.log("유람 데이터베이스가 준비됐습니다.");
} catch (error) {
  console.error(error instanceof DatabaseConfigurationError
    ? error.message
    : "초기화에 실패했습니다. Turso 주소와 쓰기 가능한 토큰을 확인해 주세요. (" + (error.code ?? error.name) + ")");
  process.exitCode = 1;
} finally {
  client?.close();
}
