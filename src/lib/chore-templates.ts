export interface ChoreTemplate {
    title: string;
    description: string;
    points: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "EPIC";
    steps: string[];
}

export const CHORE_TEMPLATES: Record<string, ChoreTemplate[]> = {
    "Kitchen": [
        {
            title: "Clean Kitchen",
            description: "Full kitchen cleanup",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Load dishwasher",
                "Wipe counters & stove",
                "Clean sink",
                "Sweep & mop floor",
                "Take out trash"
            ]
        },
        {
            title: "Dishes",
            description: "Handle the dishes",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Load dishwasher",
                "Hand wash pots/pans",
                "Dry & put away",
                "Wipe down sink"
            ]
        },
        {
            title: "Deep Clean Fridge",
            description: "Remove expired food and wipe shelves",
            points: 100,
            difficulty: "EPIC",
            steps: [
                "Empty fridge",
                "Toss expired food",
                "Wash shelves & drawers",
                "Wipe exterior",
                "Restock organized"
            ]
        },
        {
            title: "Organize Pantry",
            description: "Tidy up food storage",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Check expiration dates",
                "Group similar items",
                "Wipe shelves",
                "Restock items"
            ]
        }
    ],
    "Bathroom": [
        {
            title: "Clean Bathroom",
            description: "Standard bathroom cleaning",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Clean toilet",
                "Scrub shower/tub",
                "Wipe mirror & sink",
                "Empty trash",
                "Mop floor"
            ]
        },
        {
            title: "Quick Tidy",
            description: "Fast bathroom refresh",
            points: 10,
            difficulty: "EASY",
            steps: [
                "Wipe counters",
                "Change towels",
                "Check toilet paper"
            ]
        }
    ],
    "Living Area": [
        {
            title: "Vacuum & Dust",
            description: "Clean living room floors and surfaces",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Pick up clutter",
                "Dust surfaces",
                "Vacuum floor",
                "Fluff pillows"
            ]
        },
        {
            title: "Floors",
            description: "Vacuum and mop all main areas",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Vacuum carpets/rugs",
                "Sweep hard floors",
                "Mop hard floors"
            ]
        },
        {
            title: "Clean Windows",
            description: "Wash inside of windows and sills",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Spray glass cleaner",
                "Wipe inside glass",
                "Wipe window sills",
                "Dust blinds"
            ]
        },
        {
            title: "Clean Gaming Setup",
            description: "Maintenance for PC/Console setup",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Dust PC/Console",
                "Wipe monitor screen",
                "Clean keyboard & mouse",
                "Organize cables"
            ]
        }
    ],
    "Bedroom": [
        {
            title: "Change Sheets",
            description: "Wash and replace bed sheets",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Strip bed",
                "Wash & dry sheets",
                "Make bed with fresh linens"
            ]
        },
        {
            title: "Tidy Room",
            description: "General bedroom organization",
            points: 10,
            difficulty: "EASY",
            steps: [
                "Make bed",
                "Pick up clothes",
                "Clear nightstand"
            ]
        },
        {
            title: "Wash Bedding",
            description: "Deep clean of all bedding",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Wash duvet/comforter",
                "Wash pillows",
                "Rotate mattress",
                "Make bed"
            ]
        },
        {
            title: "Under Bed Storage",
            description: "Clean and organize under the bed",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Pull out storage bins",
                "Sort items",
                "Vacuum under bed",
                "Replace bins"
            ]
        }
    ],
    "Laundry": [
        {
            title: "Do Laundry",
            description: "Wash, dry, and fold clothes",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Sort clothes",
                "Wash load",
                "Dry load",
                "Fold & hang",
                "Put away"
            ]
        }
    ],
    "Outdoor": [
        {
            title: "Mow Lawn",
            description: "Cut the grass",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Clear yard debris",
                "Mow lawn",
                "Weed whack edges",
                "Blow clippings"
            ]
        },
        {
            title: "Wash Car",
            description: "Exterior wash and interior vacuum",
            points: 100,
            difficulty: "EPIC",
            steps: [
                "Wash exterior",
                "Clean wheels",
                "Vacuum interior",
                "Wipe dashboard/windows"
            ]
        },
        {
            title: "Gardening",
            description: "Tend to the garden",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Water plants",
                "Pull weeds",
                "Harvest/Prune"
            ]
        }
    ],
    "Pets": [
        {
            title: "Pet Care",
            description: "Daily pet maintenance",
            points: 10,
            difficulty: "EASY",
            steps: [
                "Feed & water",
                "Clean litter box / Pick up waste",
                "Brush/Groom"
            ]
        },
        {
            title: "Walk Dog",
            description: "Take the dog for a walk",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Put on leash",
                "Walk for 20+ mins",
                "Clean up waste",
                "Wipe paws if needed"
            ]
        }
    ],
    "Seasonal": [
        {
            title: "Winter Prep",
            description: "Prepare home for cold weather",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Cover outdoor faucets",
                "Store patio furniture",
                "Check window drafts",
                "Test heating system"
            ]
        },
        {
            title: "Spring Cleaning",
            description: "Deep clean the entire house",
            points: 100,
            difficulty: "EPIC",
            steps: [
                "Wash curtains/blinds",
                "Deep clean carpets",
                "Wash exterior windows",
                "Clean gutters",
                "Declutter garage"
            ]
        }
    ]
};
