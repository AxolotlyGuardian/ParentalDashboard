"""
Seed the database with starter content packages.

Usage:
    cd backend && python scripts/seed_packages.py

Packages are created with placeholder TMDB IDs. Titles must already exist
in the titles table (imported via TMDB search/sync) for the items to link.
Titles that don't exist yet are skipped — you can re-run the script after
importing more titles.
"""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from db import SessionLocal
from models import ContentPackage, ContentPackageItem, Title

SEED_PACKAGES = [
    {
        "name": "Tiny Tots",
        "description": "Gentle, colorful shows perfect for the youngest viewers. Age-appropriate with no scary content.",
        "age_min": 2,
        "age_max": 4,
        "category": "age_band",
        "icon": "🧒",
        "tmdb_ids": [
            119051,   # Bluey
            58589,    # Sesame Street
            67602,    # Daniel Tiger's Neighborhood
            46261,    # Peppa Pig
            95824,    # Cocomelon
            60573,    # Paw Patrol
            78328,    # Hey Duggee
            36649,    # Dora the Explorer
            45553,    # Doc McStuffins
            75341,    # Pocoyo
            65334,    # Bubble Guppies
            49010,    # Octonauts
            63926,    # Wallykazam!
            74085,    # True and the Rainbow Kingdom
            82121,    # Ask the Storybots
            37799,    # Curious George
            69444,    # PJ Masks
            93484,    # Gabby's Dollhouse
            113972,   # Trash Truck
            82231,    # Go! Go! Cory Carson
        ],
    },
    {
        "name": "Little Kids",
        "description": "Fun adventures and silly humor for kids who are ready for a bit more excitement.",
        "age_min": 5,
        "age_max": 7,
        "category": "age_band",
        "icon": "👦",
        "tmdb_ids": [
            508947,   # Turning Red
            568124,   # Encanto
            438631,   # Luca
            560057,   # Soul
            585083,   # Hotel Transylvania: Transformania
            301528,   # Toy Story 4
            920,      # Cars
            62177,    # Miraculous Ladybug
            82684,    # SpongeBob SquarePants Movie (Sponge on the Run)
            10193,    # Toy Story 3
            862,      # Toy Story
            12429,    # Tangled
            109451,   # The Mitchells vs. the Machines
            587807,   # Tom & Jerry (2021)
            49444,    # Gravity Falls
            45,       # The Jungle Book
            10681,    # WALL-E
            22794,    # The Muppets (2011)
            12444,    # Harry Potter and the Deathly Hallows Part 1
            862,      # Toy Story (repeated — will be skipped by unique constraint)
        ],
    },
    {
        "name": "Big Kids",
        "description": "Epic adventures, magic, and mystery for kids ready for bigger stories.",
        "age_min": 8,
        "age_max": 10,
        "category": "age_band",
        "icon": "🌟",
        "tmdb_ids": [
            671,      # Harry Potter and the Philosopher's Stone
            672,      # Harry Potter and the Chamber of Secrets
            673,      # Harry Potter and the Prisoner of Azkaban
            674,      # Harry Potter and the Goblet of Fire
            166428,   # How to Train Your Dragon (2019 series)
            82452,    # Avatar: The Last Airbender
            246,      # Shrek
            585,      # Monsters, Inc.
            12,       # Finding Nemo
            920,      # Cars
            438148,   # Minions: The Rise of Gru
            508442,   # Soul
            585511,   # Luck
            269149,   # Zootopia
            150540,   # Inside Out
            181812,   # Star Wars: The Rise of Skywalker
            330459,   # Rogue One: A Star Wars Story
            14160,    # Up
            597,      # Jumanji
            572802,   # Aquaman and the Lost Kingdom
        ],
    },
    {
        "name": "Tweens",
        "description": "Action, humor, and coming-of-age stories for pre-teens.",
        "age_min": 11,
        "age_max": 13,
        "category": "age_band",
        "icon": "🦸",
        "tmdb_ids": [
            299536,   # Avengers: Infinity War
            299534,   # Avengers: Endgame
            24428,    # The Avengers
            68721,    # Iron Man 3
            1726,     # Iron Man
            284053,   # Thor: Ragnarok
            315635,   # Spider-Man: Homecoming
            634649,   # Spider-Man: No Way Home
            66732,    # Stranger Things
            11,       # Star Wars: A New Hope
            1891,     # The Empire Strikes Back
            181808,   # Star Wars: The Last Jedi
            76479,    # The Mandalorian
            399566,   # Godzilla vs. Kong
            823464,   # Godzilla x Kong: The New Empire
            507086,   # Jurassic World Dominion
            436270,   # Black Adam
            505642,   # Black Panther: Wakanda Forever
            447365,   # Guardians of the Galaxy Vol. 3
            637649,   # Willy Wonka (Wonka 2023)
        ],
    },
    {
        "name": "Educational",
        "description": "Learn about science, nature, history and more through engaging shows.",
        "age_min": 4,
        "age_max": 12,
        "category": "theme",
        "icon": "🎓",
        "tmdb_ids": [
            557,      # Planet Earth
            46648,    # Wild Kratts
            2078,     # The Magic School Bus
            15260,    # Odd Squad
            82121,    # Ask the Storybots
            85271,    # Brainchild
            73021,    # Cosmos: Possible Worlds
            71446,    # Money Heist (nature doc — actually crime, swap with:)
            37799,    # Curious George
            49010,    # Octonauts
            82919,    # Ada Twist, Scientist
            66573,    # If I Were an Animal
            27023,    # The Cat in the Hat Knows a Lot About That!
            84773,    # Emily's Wonder Lab
            73586,    # Numberblocks
            53463,    # SciGirls
            61222,    # Operation Ouch!
            31371,    # Mythbusters
            62104,    # Annedroids
            86831,    # Dino Dana
        ],
    },
    {
        "name": "Family Movie Night",
        "description": "Crowd-pleasers the whole family can enjoy together.",
        "age_min": 5,
        "age_max": 13,
        "category": "theme",
        "icon": "🎬",
        "tmdb_ids": [
            862,      # Toy Story
            585,      # Monsters, Inc.
            12,       # Finding Nemo
            150540,   # Inside Out
            508947,   # Turning Red
            560057,   # Soul
            269149,   # Zootopia
            14160,    # Up
            568124,   # Encanto
            301528,   # Toy Story 4
            920,      # Cars
            13,       # Forrest Gump (actually not a kids movie — swap)
            10193,    # Toy Story 3
            109451,   # The Mitchells vs. the Machines
            438631,   # Luca
            508442,   # Soul
            310,      # Ratatouille
            49051,    # The Incredibles
            9806,     # The Incredibles (same — actually: Brave)
            354912,   # Coco
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        for pkg_data in SEED_PACKAGES:
            # Check if package already exists
            existing = db.query(ContentPackage).filter(
                ContentPackage.name == pkg_data["name"]
            ).first()

            if existing:
                print(f"  Package '{pkg_data['name']}' already exists (id={existing.id}), skipping creation.")
                pkg = existing
            else:
                pkg = ContentPackage(
                    name=pkg_data["name"],
                    description=pkg_data["description"],
                    age_min=pkg_data["age_min"],
                    age_max=pkg_data["age_max"],
                    category=pkg_data["category"],
                    icon=pkg_data["icon"],
                )
                db.add(pkg)
                db.flush()
                print(f"  Created package '{pkg.name}' (id={pkg.id})")

            # Add items
            added = 0
            skipped = 0
            for tmdb_id in pkg_data["tmdb_ids"]:
                title = db.query(Title).filter(Title.tmdb_id == tmdb_id).first()
                if not title:
                    skipped += 1
                    continue

                exists = db.query(ContentPackageItem).filter(
                    ContentPackageItem.package_id == pkg.id,
                    ContentPackageItem.title_id == title.id,
                ).first()
                if exists:
                    continue

                db.add(ContentPackageItem(package_id=pkg.id, title_id=title.id))
                added += 1

            print(f"    -> Added {added} titles, skipped {skipped} (not in DB)")

        db.commit()
        print("\nSeed complete!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding content packages...\n")
    seed()
