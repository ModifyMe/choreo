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
            steps: [] // Simplified
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
            steps: [] // Simplified
        }
    ],
    "Living Area": [
        {
            title: "Vacuum & Dust",
            description: "Clean living room floors and surfaces",
            points: 30,
            difficulty: "MEDIUM",
            steps: [] // Simplified
        },
        {
            title: "Floors",
            description: "Vacuum and mop all main areas",
            points: 50,
            difficulty: "HARD",
            steps: [] // Simplified
        },
        {
            title: "Clean Windows",
            description: "Wash inside of windows and sills",
            points: 30,
            difficulty: "MEDIUM",
            steps: [] // Simplified
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
            steps: [] // Simplified
        },
        {
            title: "Tidy Room",
            description: "General bedroom organization",
            points: 10,
            difficulty: "EASY",
            steps: [] // Simplified
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
            steps: [] // Simplified
        }
    ],
    "Outdoor": [
        {
            title: "Trash Day",
            description: "Take out all trash and recycling",
            points: 20,
            difficulty: "EASY",
            steps: [
                "Collect all trash bags",
                "Take recycling out",
                "Bring bins to curb"
            ]
        },
        {
            title: "Mow Lawn",
            description: "Cut the grass",
            points: 50,
            difficulty: "HARD",
            steps: [] // Simplified
        },
        {
            title: "Wash Car",
            description: "Exterior wash and interior vacuum",
            points: 100,
            difficulty: "EPIC",
            steps: [] // Simplified
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
            title: "Feed Pets",
            description: "Give food and water",
            points: 10,
            difficulty: "EASY",
            steps: []
        },
        {
            title: "Clean Litter",
            description: "Scoop and clean litter box",
            points: 10,
            difficulty: "EASY",
            steps: []
        },
        {
            title: "Pet Care",
            description: "General pet maintenance",
            points: 10,
            difficulty: "EASY",
            steps: [] // Simplified
        },
        {
            title: "Walk Dog",
            description: "Take the dog for a walk",
            points: 30,
            difficulty: "MEDIUM",
            steps: [] // Simplified
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
