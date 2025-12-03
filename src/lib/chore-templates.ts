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
                "Wipe counters",
                "Clean sink",
                "Sweep floor",
                "Take out trash"
            ]
        },
        {
            title: "Load Dishwasher",
            description: "Load and start the dishwasher",
            points: 10,
            difficulty: "EASY",
            steps: [
                "Rinse dishes",
                "Load bottom rack",
                "Load top rack",
                "Add detergent",
                "Start cycle"
            ]
        },
        {
            title: "Deep Clean Fridge",
            description: "Remove expired food and wipe shelves",
            points: 100,
            difficulty: "EPIC",
            steps: [
                "Remove all items",
                "Throw away expired food",
                "Remove and wash shelves/drawers",
                "Wipe interior walls",
                "Restock organized"
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
                "Wipe mirror",
                "Clean sink",
                "Mop floor"
            ]
        },
        {
            title: "Restock Toiletries",
            description: "Refill soap, toilet paper, etc.",
            points: 10,
            difficulty: "EASY",
            steps: [
                "Check toilet paper",
                "Refill hand soap",
                "Replace towels",
                "Check shampoo/body wash"
            ]
        }
    ],
    "Living Area": [
        {
            title: "Vacuum Living Room",
            description: "Vacuum carpet and rugs",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Pick up loose items",
                "Move light furniture",
                "Vacuum main area",
                "Vacuum under sofa",
                "Replace furniture"
            ]
        },
        {
            title: "Dusting",
            description: "Dust surfaces in living areas",
            points: 30,
            difficulty: "MEDIUM",
            steps: [
                "Dust TV stand",
                "Dust bookshelves",
                "Dust window sills",
                "Dust ceiling fan"
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
                "Wash sheets",
                "Put on fitted sheet",
                "Put on flat sheet",
                "Put on pillowcases"
            ]
        },
        {
            title: "Organize Closet",
            description: "Tidy up clothes and shoes",
            points: 50,
            difficulty: "HARD",
            steps: [
                "Pick up clothes from floor",
                "Fold clean laundry",
                "Hang up jackets/shirts",
                "Organize shoes"
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
                "Clear debris/toys",
                "Check gas/battery",
                "Mow front yard",
                "Mow back yard",
                "Clean mower"
            ]
        },
        {
            title: "Wash Car",
            description: "Exterior wash and interior vacuum",
            points: 100,
            difficulty: "EPIC",
            steps: [
                "Rinse car",
                "Soap and scrub",
                "Rinse off soap",
                "Dry with chamois",
                "Vacuum interior",
                "Clean windows"
            ]
        }
    ]
};
