-- pgTAP bootstrap test: confirms pgTAP is loaded and the public schema exists.
-- T-SETUP-2

BEGIN;
SELECT plan(2);

SELECT has_schema('public', 'public schema exists');
SELECT ok(true, 'pgTAP is running');

SELECT * FROM finish();
ROLLBACK;
