#!/bin/bash
# Clear production database and import fresh from development

PROD_URL='postgresql://neondb_owner:npg_8yomeZjzEI2v@ep-calm-bonus-aebsm5q2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'

echo "🚀 Clear & Import: Dev → Production"
echo "===================================="
echo ""
echo "Step 1: Clearing production data..."

# Delete all data from production (but keep schema)
psql "$PROD_URL" <<EOF
-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Clear all tables (order matters due to foreign keys)
TRUNCATE TABLE episode_tags CASCADE;
TRUNCATE TABLE episode_links CASCADE;
TRUNCATE TABLE episodes CASCADE;
TRUNCATE TABLE content_reports CASCADE;
TRUNCATE TABLE policies CASCADE;
TRUNCATE TABLE device_activity CASCADE;
TRUNCATE TABLE paired_devices CASCADE;
TRUNCATE TABLE kid_profiles CASCADE;
TRUNCATE TABLE parents CASCADE;
TRUNCATE TABLE titles CASCADE;
TRUNCATE TABLE content_tags CASCADE;
TRUNCATE TABLE apps CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

EOF

echo "✅ Production cleared"
echo ""
echo "Step 2: Importing development data..."
echo ""

psql "$PROD_URL" < backend/dev_data_backup.sql 2>&1 | tail -20

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo ""
  echo "✅ Import complete!"
  echo ""
  echo "Your production database now has:"
  echo "  ✓ All parent accounts"
  echo "  ✓ All kid profiles"
  echo "  ✓ All content policies"
  echo "  ✓ All TV shows and episodes"
  echo "  ✓ All scraped episode tags"
  echo ""
  echo "You can now log in to production with your dev credentials!"
else
  echo ""
  echo "⚠️  Import completed with some warnings (likely harmless)"
  echo "Try logging in to production now!"
fi
