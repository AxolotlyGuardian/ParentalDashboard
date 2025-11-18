#!/bin/bash
# Auto-import script - runs without confirmation

PROD_URL='postgresql://neondb_owner:npg_8yomeZjzEI2v@ep-calm-bonus-aebsm5q2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'

echo "🚀 Importing Development Data to Production Database"
echo "===================================================="
echo ""
echo "📊 Database Info:"
echo "   Dev DB:  $(echo $DATABASE_URL | sed 's/.*@//' | sed 's/\?.*//')"
echo "   Prod DB: $(echo $PROD_URL | sed 's/.*@//' | sed 's/\?.*//')"
echo ""
echo "⚠️  Auto-importing (no confirmation)..."
echo ""

psql "$PROD_URL" < backend/dev_data_backup.sql 2>&1 | grep -E "INSERT|ERROR|DETAIL|HINT" | head -50

if [ ${PIPESTATUS[0]} -eq 0 ]; then
  echo ""
  echo "✅ Import complete!"
  echo ""
  echo "Your production database now has all your data!"
  echo "You can now log in with your dev credentials."
else
  echo ""
  echo "❌ Import had some errors (see above)"
  echo "Some data may have been imported successfully."
fi
