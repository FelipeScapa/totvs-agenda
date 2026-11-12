# Architecture rules

- Application JSON exports read all allowlisted public agenda tables directly with pagination and local financial keys; they are not full database backups and exclude storage file contents.
- Application JSON imports validate before writing and only add missing records; never delete or overwrite existing cloud or local data during this recovery workflow.