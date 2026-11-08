-- T-SETUP-2: pgTAP runs against the local database.
begin;
select plan(1);
select has_schema('public', 'T-SETUP-2 the public schema exists');
select * from finish();
rollback;
