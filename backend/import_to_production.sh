#!/bin/bash

echo "🚀 Importing Development Data to Production Database"
echo "===================================================="
echo ""

if [ -z "$PRODUCTION_DATABASE_URL" ]; then
  echo "❌ Error: PRODUCTION_DATABASE_URL not set"
  echo ""
  echo "To get your production database URL:"
  echo "1. Click the 'Database' tool in the left sidebar"
  echo "2. Switch to 'Production' tab at the top"
  echo "3. Click 'Commands' tab"
  echo "4. Copy the DATABASE_URL from the Environment variables section"
  echo ""
  echo "Then run:"
  echo "  PRODUCTION_DATABASE_URL='<your-prod-url>' ./backend/import_to_production.sh"
  exit 1
fi

if [ ! -f "backend/dev_data_backup.sql" ]; then
  echo "❌ Error: dev_data_backup.sql not found"
  echo "Please run the export first from backend directory:"
  echo "  cd backend && pg_dump --data-only --no-owner --no-privileges --column-inserts \"\$DATABASE_URL\" > dev_data_backup.sql"
  exit 1
fi

echo "📊 Database Info:"
echo "   Dev DB:  $(echo $DATABASE_URL | sed 's/.*@//' | sed 's/\?.*//')"
echo "   Prod DB: $(echo $PRODUCTION_DATABASE_URL | sed 's/.*@//' | sed 's/\?.*//')"
echo ""

read -p "⚠️  This will OVERWRITE all data in production. Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled"
  exit 0
fi

echo ""
echo "🔄 Importing data..."

psql "$PRODUCTION_DATABASE_URL" < backend/dev_data_backup.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Import complete!"
  echo ""
  echo "Your production database now has all your:"
  echo "  ✓ Parent accounts"
  echo "  ✓ Kid profiles"
  echo "  ✓ Content policies"
  echo "  ✓ TV shows and episodes"
  echo "  ✓ Scraped episode tags"
  echo "  ✓ Paired devices"
  echo ""
  echo "You can now log in to production with your dev credentials!"
else
  echo ""
  echo "❌ Import failed. Check the errors above."
fi
