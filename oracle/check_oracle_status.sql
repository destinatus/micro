set linesize 200
set pagesize 100
column status format a10
column name format a10
select instance_name, status, database_status from v$instance;
select name, open_mode from v$pdbs;
exit;
