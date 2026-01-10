SELECT id, title, (SELECT count(*) FROM tournament_registrations WHERE tournament_id = tournaments.id) as reg_count FROM tournaments;
