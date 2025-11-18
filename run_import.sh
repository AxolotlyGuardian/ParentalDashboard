#!/bin/bash
# Simple import script - just run: ./run_import.sh

export PRODUCTION_DATABASE_URL='postgresql://neondb_owner:npg_8yomeZjzEI2v@ep-calm-bonus-aebsm5q2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'

./backend/import_to_production.sh
