// Temporary: round names of Serie C and Coppa Italia (names only).
import { apiSports } from "./lib/api-sports.mjs";
const api = apiSports("football", process.env.API_FOOTBALL_KEY);
for (const [id, y] of [[138, 2026], [942, 2026], [137, 2026], [137, 2025], [72, 2026], [45, 2025]]) {
  const rounds = await api.get(`/fixtures/rounds?league=${id}&season=${y}`);
  console.log(`ROUNDS ${id} ${y}: ${rounds.join(" | ")}`);
}
