/**
 * Local mock of the Google Sheets CSV endpoint.
 *
 * Serves deliberately messy data (snake_case values, mixed date formats,
 * duplicates, a bad URL) so the normalisation and validation logic can be
 * verified end to end:
 *
 *   node scripts/mock-sheet-server.mjs &
 *   GOOGLE_SHEET_CSV_URL=http://127.0.0.1:4999/events.csv npm run build
 */
import http from "node:http";

const CSV = `Date,Day,Time,Event,Category,Details,Participants,Age Group,Venue,Volunteer / Coordinator,Contact,Rules,Registration,Featured,Status
2026-09-08,,7:00 pm - 8:00 pm,singing_competition,cultural_evening,Society singing contest for all age groups.,all_residents,,main_stage,priya_sharma,9876500001,One song per participant.,,yes,scheduled
15/09/2026,,5:00 PM-6:30 PM,KIDS DRAWING COMPETITION,kids,Themed drawing contest.,children,5-12 years,club_house,ravi kumar (9876500002),,Bring your own colours.,example.com/register/drawing,,scheduled
2026-09-19,Saturday,7:00 PM - 9:30 PM,talent_night,cultural,Stage performances by residents.,all_residents,All ages,main_stage,youth_committee,9876500003,Five minute slots.,https://example.com/register/talent,YES,scheduled
2026-09-19,Saturday,7:00 PM - 9:30 PM,talent_night,cultural,Duplicate row that must be skipped.,all_residents,All ages,main_stage,youth_committee,9876500003,Five minute slots.,https://example.com/register/talent,YES,scheduled
2026-09-21,,,rangoli_workshop,,Row with a missing venue and time.,,,,,,,,,cancelled
,,,,,Row with no usable data at all.,,,,,,,,,
2026-09-25,,4:00 PM - 8:00 PM,uttar_puja_and_visarjan,puja,Farewell procession and eco-conscious Visarjan.,all_residents,All ages,central_lawn,festival_committee,9876500004,Follow the eco-guidelines.,,,postponed
`;

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/csv; charset=utf-8" });
  response.end(CSV);
});

server.listen(4999, "127.0.0.1", () => {
  console.log("Mock sheet server listening on http://127.0.0.1:4999/events.csv");
});

