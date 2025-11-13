from db import SessionLocal
from models import ContentTag

def populate_tags():
    db = SessionLocal()
    
    # Define all content tags with categories
    tags = [
        # Creatures & Characters
        {"category": "creatures", "slug": "clowns", "display_name": "Clowns", "description": "Clown characters or imagery"},
        {"category": "creatures", "slug": "spiders", "display_name": "Spiders", "description": "Spider scenes or imagery"},
        {"category": "creatures", "slug": "snakes", "display_name": "Snakes", "description": "Snake scenes or imagery"},
        {"category": "creatures", "slug": "bees_wasps", "display_name": "Bees/Wasps", "description": "Stinging insect scenes"},
        {"category": "creatures", "slug": "large_dogs", "display_name": "Large Dogs", "description": "Large or aggressive dog scenes"},
        {"category": "creatures", "slug": "sharks", "display_name": "Sharks", "description": "Shark scenes or water predators"},
        {"category": "creatures", "slug": "dinosaurs", "display_name": "Dinosaurs", "description": "Dinosaur characters or scenes"},
        {"category": "creatures", "slug": "monsters", "display_name": "Monsters", "description": "Monster characters or creatures"},
        {"category": "creatures", "slug": "ghosts", "display_name": "Ghosts", "description": "Supernatural ghost characters"},
        {"category": "creatures", "slug": "zombies", "display_name": "Zombies", "description": "Undead or zombie characters"},
        {"category": "creatures", "slug": "witches", "display_name": "Witches", "description": "Witch characters or magic"},
        {"category": "creatures", "slug": "skeletons", "display_name": "Skeletons", "description": "Skeleton imagery or characters"},
        {"category": "creatures", "slug": "aliens", "display_name": "Aliens", "description": "Extraterrestrial beings"},
        {"category": "creatures", "slug": "robots", "display_name": "Scary Robots", "description": "Threatening robotic characters"},
        {"category": "creatures", "slug": "grotesque_faces", "display_name": "Grotesque Faces", "description": "Distorted or unusual-looking characters"},
        {"category": "creatures", "slug": "transforming_characters", "display_name": "Transforming Characters", "description": "Characters that change form"},
        
        # Situations & Themes
        {"category": "situations", "slug": "darkness", "display_name": "Darkness", "description": "Dark scenes or nighttime settings"},
        {"category": "situations", "slug": "confined_spaces", "display_name": "Confined Spaces", "description": "Claustrophobic settings"},
        {"category": "situations", "slug": "heights", "display_name": "Heights", "description": "High places or falling scenes"},
        {"category": "situations", "slug": "water_danger", "display_name": "Water Danger", "description": "Drowning or deep water scenes"},
        {"category": "situations", "slug": "thunderstorms", "display_name": "Thunderstorms", "description": "Storm or lightning scenes"},
        {"category": "situations", "slug": "fire", "display_name": "Fire", "description": "Fire scenes or emergencies"},
        {"category": "situations", "slug": "natural_disasters", "display_name": "Natural Disasters", "description": "Earthquakes, tornadoes, floods"},
        {"category": "situations", "slug": "medical_procedures", "display_name": "Medical Procedures", "description": "Needles, doctors, hospitals"},
        {"category": "situations", "slug": "dentist_scenes", "display_name": "Dentist Scenes", "description": "Dental procedures"},
        {"category": "situations", "slug": "blood", "display_name": "Blood", "description": "Blood or injury scenes"},
        {"category": "situations", "slug": "being_lost", "display_name": "Being Lost", "description": "Child separated from parents"},
        {"category": "situations", "slug": "kidnapping", "display_name": "Kidnapping", "description": "Abduction themes"},
        {"category": "situations", "slug": "home_invasion", "display_name": "Home Invasion", "description": "Intruder or burglary scenes"},
        {"category": "situations", "slug": "car_accident", "display_name": "Car Accident", "description": "Vehicle crash scenes"},
        {"category": "situations", "slug": "plane_crash", "display_name": "Plane Crash", "description": "Aviation disasters"},
        
        # Death & Loss
        {"category": "death_loss", "slug": "parent_death", "display_name": "Parent Death", "description": "Death of parent character"},
        {"category": "death_loss", "slug": "child_death", "display_name": "Child Death", "description": "Death of child character"},
        {"category": "death_loss", "slug": "pet_death", "display_name": "Pet Death", "description": "Death of animal companion"},
        {"category": "death_loss", "slug": "funeral_scenes", "display_name": "Funeral Scenes", "description": "Death ceremonies"},
        {"category": "death_loss", "slug": "grief_themes", "display_name": "Grief Themes", "description": "Processing loss"},
        
        # Scary Visuals & Atmosphere
        {"category": "visuals", "slug": "jump_scares", "display_name": "Jump Scares", "description": "Sudden shocking moments"},
        {"category": "visuals", "slug": "suspense_music", "display_name": "Suspense Music", "description": "Tension-building scores"},
        {"category": "visuals", "slug": "shadows", "display_name": "Scary Shadows", "description": "Scary shadow imagery"},
        {"category": "visuals", "slug": "under_bed", "display_name": "Under the Bed", "description": "Hiding or lurking themes"},
        {"category": "visuals", "slug": "closet_scenes", "display_name": "Closet Scenes", "description": "Fear of what's in the closet"},
        {"category": "visuals", "slug": "mirror_scares", "display_name": "Mirror Scares", "description": "Reflections or mirror tricks"},
        {"category": "visuals", "slug": "nightmares", "display_name": "Nightmares", "description": "Frightening dream sequences"},
        {"category": "visuals", "slug": "hallucinations", "display_name": "Hallucinations", "description": "Distorted reality scenes"},
        {"category": "visuals", "slug": "intense_chases", "display_name": "Intense Chases", "description": "Fast-paced pursuit scenes"},
        
        # Intensity Levels
        {"category": "intensity", "slug": "mild_peril", "display_name": "Mild Peril", "description": "Brief moments of danger"},
        {"category": "intensity", "slug": "moderate_peril", "display_name": "Moderate Peril", "description": "Extended danger sequences"},
        {"category": "intensity", "slug": "intense_action", "display_name": "Intense Action", "description": "High-intensity action scenes"},
        {"category": "intensity", "slug": "psychological_horror", "display_name": "Psychological Horror", "description": "Mental/emotional fear"},
        
        # Social Fears
        {"category": "social", "slug": "bullying", "display_name": "Bullying", "description": "Peer harassment scenes"},
        {"category": "social", "slug": "public_embarrassment", "display_name": "Public Embarrassment", "description": "Humiliation scenes"},
        {"category": "social", "slug": "social_rejection", "display_name": "Social Rejection", "description": "Being excluded or rejected"},
        
        # Content Ratings
        {"category": "rating", "slug": "rating_g", "display_name": "G - General Audiences", "description": "All ages admitted"},
        {"category": "rating", "slug": "rating_pg", "display_name": "PG - Parental Guidance", "description": "Some material may not be suitable for children"},
        {"category": "rating", "slug": "rating_pg13", "display_name": "PG-13", "description": "Parents strongly cautioned"},
        {"category": "rating", "slug": "rating_r", "display_name": "R - Restricted", "description": "Under 17 requires parent/guardian"},
        {"category": "rating", "slug": "rating_tv_y", "display_name": "TV-Y", "description": "All children"},
        {"category": "rating", "slug": "rating_tv_y7", "display_name": "TV-Y7", "description": "Directed to older children"},
        {"category": "rating", "slug": "rating_tv_g", "display_name": "TV-G", "description": "General audience"},
        {"category": "rating", "slug": "rating_tv_pg", "display_name": "TV-PG", "description": "Parental guidance suggested"},
        {"category": "rating", "slug": "rating_tv_14", "display_name": "TV-14", "description": "Parents strongly cautioned"},
        {"category": "rating", "slug": "rating_tv_ma", "display_name": "TV-MA", "description": "Mature audiences only"},
        
        # Age Appropriateness
        {"category": "age", "slug": "preschool", "display_name": "Preschool (2-4)", "description": "Appropriate for ages 2-4"},
        {"category": "age", "slug": "early_childhood", "display_name": "Early Childhood (5-7)", "description": "Appropriate for ages 5-7"},
        {"category": "age", "slug": "kids", "display_name": "Kids (8-12)", "description": "Appropriate for ages 8-12"},
        {"category": "age", "slug": "teens", "display_name": "Teens (13-17)", "description": "Appropriate for ages 13-17"},
        {"category": "age", "slug": "family_friendly", "display_name": "Family Friendly", "description": "Suitable for all ages"},
        {"category": "age", "slug": "adults_only", "display_name": "Adults Only", "description": "18+ content"},
        
        # Content Warnings
        {"category": "content_warning", "slug": "violence", "display_name": "Violence", "description": "Contains violent content"},
        {"category": "content_warning", "slug": "language", "display_name": "Strong Language", "description": "Profanity or crude language"},
        {"category": "content_warning", "slug": "sexual_content", "display_name": "Sexual Content", "description": "Sexual themes or situations"},
        {"category": "content_warning", "slug": "drug_use", "display_name": "Drug Use", "description": "Substance abuse themes"},
    ]
    
    # Check if tags already exist
    existing_count = db.query(ContentTag).count()
    if existing_count > 0:
        print(f"Tags already populated ({existing_count} tags found)")
        db.close()
        return
    
    # Insert all tags
    for tag_data in tags:
        tag = ContentTag(**tag_data)
        db.add(tag)
    
    db.commit()
    print(f"Successfully populated {len(tags)} content tags")
    db.close()

if __name__ == "__main__":
    populate_tags()
