"""
Export development database data to SQL file
This exports all data (users, profiles, policies, content, tags, etc.)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from db import SessionLocal
from sqlalchemy import text
import subprocess

def export_to_sql():
    """Export development database to SQL dump file"""
    
    # Get database connection string from environment
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL not found")
        return
    
    print("🔄 Exporting development database...")
    print(f"   Source: {db_url.split('@')[1].split('/')[0]}")
    
    # Export using pg_dump
    output_file = "dev_database_export.sql"
    
    try:
        # Use pg_dump to export data only (not schema, since that's already applied)
        result = subprocess.run(
            ["pg_dump", "--data-only", "--no-owner", "--no-privileges", db_url],
            capture_output=True,
            text=True,
            check=True
        )
        
        with open(output_file, 'w') as f:
            f.write(result.stdout)
        
        print(f"✅ Export complete: {output_file}")
        print(f"   File size: {os.path.getsize(output_file) / 1024:.1f} KB")
        print("\nNext steps:")
        print("1. Download this file from your Replit workspace")
        print("2. Go to Database pane > Production > Connection")
        print("3. Copy the production DATABASE_URL")
        print("4. Run: psql <PRODUCTION_DATABASE_URL> < dev_database_export.sql")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Export failed: {e.stderr}")
    except FileNotFoundError:
        print("❌ pg_dump not found. Installing...")
        print("   Run: which pg_dump")

if __name__ == "__main__":
    export_to_sql()
